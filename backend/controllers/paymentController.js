const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const { getISTDate, getISTDateStr, getISTTime12h, getISTDateTimeStr } = require('../utils/istDate');

// Default initial UPI apps for seeding
const DEFAULT_UPI_APPS = [
  {
    app_name: 'PhonePe',
    app_code: 'phonepe',
    upi_id: '',
    payee_name: 'Pravesh',
    is_active: 1,
    display_order: 1
  },
  {
    app_name: 'Google Pay',
    app_code: 'gpay',
    upi_id: '',
    payee_name: 'Pravesh',
    is_active: 1,
    display_order: 2
  },
  {
    app_name: 'Paytm UPI',
    app_code: 'paytm',
    upi_id: '',
    payee_name: 'Pravesh',
    is_active: 1,
    display_order: 3
  },
  {
    app_name: 'BHIM UPI',
    app_code: 'bhim',
    upi_id: '',
    payee_name: 'Pravesh',
    is_active: 1,
    display_order: 4
  },
  {
    app_name: 'Any UPI App',
    app_code: 'upi',
    upi_id: '',
    payee_name: 'Pravesh',
    is_active: 1,
    display_order: 5
  }
];

// Initialize UPI schema & Seed default apps
let isInitialized = false;
async function initUpiSchema() {
  if (isInitialized) return;
  try {
    // 1. Ensure admin_settings columns exist
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN deposit_mode VARCHAR(20) DEFAULT 'upi_intent'`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN active_payment_gateway VARCHAR(50) DEFAULT 'upi_intent'`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN payment_upi_id VARCHAR(150) DEFAULT ''`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN upi_payment_id VARCHAR(150) DEFAULT ''`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN payment_barcode_image LONGTEXT`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings MODIFY COLUMN payment_barcode_image LONGTEXT`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN show_upi TINYINT(1) DEFAULT 1`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN show_qr TINYINT(1) DEFAULT 1`);
    } catch (e) {}
    try {
      await db.query(`ALTER TABLE admin_settings ADD COLUMN auto_upi_id VARCHAR(150) DEFAULT ''`);
    } catch (e) {}

    // Ensure user_auto_deposite columns txt_id and txt_request can store VARCHAR strings (e.g. 12-digit UTR)
    try {
      await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_id VARCHAR(150) NOT NULL DEFAULT '0'`);
    } catch (e1) {
      try {
        await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_id VARCHAR(150) DEFAULT '0'`);
      } catch (e2) {
        try {
          await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_id BIGINT DEFAULT 0`);
        } catch (e3) {
          console.warn('Could not alter user_auto_deposite.txt_id:', e3.message);
        }
      }
    }

    try {
      await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_request VARCHAR(150) NOT NULL DEFAULT ''`);
    } catch (e1) {
      try {
        await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_request VARCHAR(150) DEFAULT ''`);
      } catch (e2) {}
    }

    // 2. Create upi_gateways table
    await db.query(`
      CREATE TABLE IF NOT EXISTS upi_gateways (
        id INT AUTO_INCREMENT PRIMARY KEY,
        app_name VARCHAR(100) NOT NULL,
        app_code VARCHAR(50) DEFAULT 'upi',
        upi_id VARCHAR(150) NOT NULL,
        payee_name VARCHAR(150) DEFAULT '',
        is_active TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 3. Check if table is empty, seed initial apps
    const [existing] = await db.query('SELECT COUNT(*) AS count FROM upi_gateways');
    if (existing[0].count === 0) {
      const [settingsList] = await db.query('SELECT payment_upi_id, upi_payment_id, phonepepay_upi, gpay_upi, ac_name FROM admin_settings LIMIT 1');
      const settings = settingsList && settingsList[0] ? settingsList[0] : {};
      const defaultUpi = settings?.payment_upi_id || settings?.upi_payment_id || 'payment@upi';
      const payeeName = settings?.ac_name || 'Pravesh Online';

      for (const item of DEFAULT_UPI_APPS) {
        let appUpi = defaultUpi;
        if (item.app_code === 'phonepe' && settings?.phonepepay_upi) {
          appUpi = settings.phonepepay_upi;
        } else if (item.app_code === 'gpay' && settings?.gpay_upi) {
          appUpi = settings.gpay_upi;
        }

        await db.query(
          `INSERT INTO upi_gateways (app_name, app_code, upi_id, payee_name, is_active, display_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.app_name, item.app_code, appUpi, payeeName, item.is_active, item.display_order]
        );
      }
    }

    const [debugSettings] = await db.query('SELECT id, deposit_mode, payment_upi_id, upi_payment_id, auto_upi_id FROM admin_settings LIMIT 1');
    console.log('[DEBUG admin_settings]:', debugSettings && debugSettings[0]);

    // 3. Create auto_payment_gateways table for multiple automated gateways (NiceUpi, IMB, ZenUpi)
    await db.query(`
      CREATE TABLE IF NOT EXISTS auto_payment_gateways (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gateway_code VARCHAR(50) UNIQUE NOT NULL,
        gateway_name VARCHAR(100) NOT NULL,
        api_token TEXT,
        user_token TEXT,
        merchant_id VARCHAR(150) DEFAULT '',
        webhook_url VARCHAR(255) DEFAULT '',
        is_active TINYINT(1) DEFAULT 0,
        extra_config JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure user_token column exists in existing deployments
    try {
      await db.query(`ALTER TABLE auto_payment_gateways ADD COLUMN user_token TEXT`);
    } catch (e) {}

    // Ensure default 3 gateways exist
    const defaultGateways = [
      { code: 'niceupi', name: 'NiceUpi', active: 1 },
      { code: 'imb', name: 'IMB Payment getway', active: 0 },
      { code: 'zenupi', name: 'ZenUpi', active: 0 }
    ];

    for (const gw of defaultGateways) {
      const [exists] = await db.query('SELECT id FROM auto_payment_gateways WHERE gateway_code = ?', [gw.code]);
      if (exists.length === 0) {
        await db.query(
          'INSERT INTO auto_payment_gateways (gateway_code, gateway_name, is_active) VALUES (?, ?, ?)',
          [gw.code, gw.name, gw.active]
        );
      }
    }

    const [anyActive] = await db.query('SELECT id FROM auto_payment_gateways WHERE is_active = 1 LIMIT 1');
    if (anyActive.length === 0) {
      await db.query("UPDATE auto_payment_gateways SET is_active = 1 WHERE gateway_code = 'niceupi'");
    }

    // Clean up ghost unconfirmed intent requests created merely by clicking Pay Now (txt_id = '0' and status = '0')
    try {
      await db.query("DELETE FROM user_auto_deposite WHERE txt_id = '0' AND status = '0' AND txt_request LIKE 'UPI_%'");
      await db.query("DELETE FROM user_fund_request WHERE status = '0' AND trans_details LIKE 'Auto UPI%Order: UPI_%' AND trans_details NOT LIKE '%UTR:%'");
    } catch (cleanErr) {
      console.warn('Ghost request cleanup notice:', cleanErr.message);
    }

    isInitialized = true;
  } catch (err) {
    console.error('Error initializing upi_gateways schema:', err.message);
  }
}

// Helper: Reliably fetch the admin_settings record regardless of id column value
async function getAdminSettingsRow() {
  const [rows] = await db.query('SELECT * FROM admin_settings LIMIT 1');
  return (rows && rows.length > 0) ? rows[0] : {};
}

// Auto-run schema init on load
initUpiSchema();

// Admin: Get all UPI Apps & Current Deposit Settings
exports.getAdminGateways = async (req, res) => {
  try {
    await initUpiSchema();

    // 1. Get settings from admin_settings
    const settings = await getAdminSettingsRow();
    const depositMode = settings?.deposit_mode || 'upi_intent';
    const defaultUpiId = settings?.payment_upi_id || settings?.upi_payment_id || '';
    const autoUpiId = settings?.auto_upi_id || '';
    const payeeName = settings?.ac_name || 'Pravesh';
    const paymentBarcodeImage = settings?.payment_barcode_image || '';
    const showUpi = settings?.show_upi !== undefined ? settings.show_upi : 1;
    const showQr = settings?.show_qr !== undefined ? settings.show_qr : 1;

    // 2. Get all UPI Apps
    const [upiApps] = await db.query('SELECT * FROM upi_gateways ORDER BY display_order ASC, id ASC');

    // 3. Get multiple Auto Payment Gateways (NiceUpi, IMB Payment getway, ZenUpi)
    const [autoGateways] = await db.query('SELECT * FROM auto_payment_gateways ORDER BY id ASC');
    const activeGwRow = autoGateways.find(g => g.is_active === 1) || autoGateways[0];
    const activeGatewayCode = activeGwRow?.gateway_code || settings?.active_payment_gateway || 'niceupi';

    return res.json({
      success: '1',
      deposit_mode: depositMode,
      default_upi_id: defaultUpiId,
      auto_upi_id: autoUpiId,
      payee_name: payeeName,
      payment_barcode_image: paymentBarcodeImage,
      show_upi: showUpi,
      show_qr: showQr,
      min_deposite: settings?.min_deposite || '100',
      max_deposite: settings?.max_deposite || '50000',
      upi_apps: upiApps,
      active_payment_gateway: activeGatewayCode,
      gateways: autoGateways
    });
  } catch (err) {
    console.error('getAdminGateways error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Add New UPI App
exports.addUpiApp = async (req, res) => {
  const { app_name, app_code, upi_id, payee_name, is_active } = req.body;

  if (!app_name || !app_name.trim()) {
    return res.status(400).json({ success: '0', msg: 'UPI App Name is required (e.g. Google Pay, PhonePe)' });
  }
  if (!upi_id || !upi_id.trim()) {
    return res.status(400).json({ success: '0', msg: 'UPI ID is required (e.g. merchant@okhdfcbank)' });
  }

  try {
    await initUpiSchema();

    const cleanName = app_name.trim();
    const cleanUpi = upi_id.trim();
    const cleanPayee = (payee_name || '').trim();
    const code = (app_code || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 50) || 'upi';
    const active = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    // Get max display order
    const [[maxRow]] = await db.query('SELECT MAX(display_order) as max_order FROM upi_gateways');
    const displayOrder = (maxRow?.max_order || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO upi_gateways (app_name, app_code, upi_id, payee_name, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cleanName, code, cleanUpi, cleanPayee, active, displayOrder]
    );

    // If default UPI in admin_settings is empty, sync it
    const settings = await getAdminSettingsRow();
    if (!settings?.payment_upi_id && !settings?.upi_payment_id) {
      if (settings?.id !== undefined) {
        await db.query('UPDATE admin_settings SET payment_upi_id = ?, upi_payment_id = ? WHERE id = ?', [cleanUpi, cleanUpi, settings.id]);
      } else {
        await db.query('UPDATE admin_settings SET payment_upi_id = ?, upi_payment_id = ?', [cleanUpi, cleanUpi]);
      }
    }

    return res.json({
      success: '1',
      msg: `UPI App "${cleanName}" added successfully!`,
      app_id: result.insertId
    });
  } catch (err) {
    console.error('addUpiApp error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Update UPI App
exports.updateUpiApp = async (req, res) => {
  const { id, app_name, app_code, upi_id, payee_name, is_active } = req.body;

  if (!id) {
    return res.status(400).json({ success: '0', msg: 'App ID is required' });
  }

  try {
    await initUpiSchema();

    const [existing] = await db.query('SELECT * FROM upi_gateways WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: '0', msg: 'UPI App not found' });
    }

    const current = existing[0];
    const cleanName = app_name !== undefined ? app_name.trim() : current.app_name;
    const cleanUpi = upi_id !== undefined ? upi_id.trim() : current.upi_id;
    const cleanPayee = payee_name !== undefined ? payee_name.trim() : current.payee_name;
    const code = app_code !== undefined ? app_code : current.app_code;
    const active = is_active !== undefined ? (is_active ? 1 : 0) : current.is_active;

    await db.query(
      `UPDATE upi_gateways SET app_name = ?, app_code = ?, upi_id = ?, payee_name = ?, is_active = ? WHERE id = ?`,
      [cleanName, code, cleanUpi, cleanPayee, active, id]
    );

    return res.json({
      success: '1',
      msg: `UPI App "${cleanName}" updated successfully!`
    });
  } catch (err) {
    console.error('updateUpiApp error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Delete UPI App
exports.deleteUpiApp = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: '0', msg: 'App ID is required' });
  }

  try {
    await initUpiSchema();
    await db.query('DELETE FROM upi_gateways WHERE id = ?', [id]);
    return res.json({
      success: '1',
      msg: 'UPI App removed successfully'
    });
  } catch (err) {
    console.error('deleteUpiApp error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Toggle UPI App Active Status
exports.toggleUpiApp = async (req, res) => {
  const { id, is_active } = req.body;
  if (!id) {
    return res.status(400).json({ success: '0', msg: 'App ID is required' });
  }

  try {
    await initUpiSchema();
    const active = is_active ? 1 : 0;
    await db.query('UPDATE upi_gateways SET is_active = ? WHERE id = ?', [active, id]);
    return res.json({
      success: '1',
      msg: `UPI App status updated to ${active ? 'Active' : 'Inactive'}`
    });
  } catch (err) {
    console.error('toggleUpiApp error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Set Primary / Default UPI ID, Payee Name & QR Code Settings
exports.setDefaultUpi = async (req, res) => {
  const { upi_id, auto_upi_id, payee_name, payment_barcode_image, show_upi, show_qr } = req.body;

  try {
    await initUpiSchema();
    const cleanUpi = (upi_id || auto_upi_id || '').trim();
    const cleanPayee = (payee_name || '').trim();
    const cleanQr = payment_barcode_image !== undefined ? (payment_barcode_image || '') : undefined;
    const isShowUpi = show_upi !== undefined ? (show_upi === 1 || show_upi === '1' || show_upi === true ? 1 : 0) : undefined;
    const isShowQr = show_qr !== undefined ? (show_qr === 1 || show_qr === '1' || show_qr === true ? 1 : 0) : undefined;

    let updateQuery = 'UPDATE admin_settings SET payment_upi_id = ?, upi_payment_id = ?';
    let queryParams = [cleanUpi, cleanUpi];

    if (auto_upi_id !== undefined && auto_upi_id !== null) {
      updateQuery += ', auto_upi_id = ?';
      queryParams.push(auto_upi_id.trim());
    }
    if (cleanPayee) {
      updateQuery += ', ac_name = ?';
      queryParams.push(cleanPayee);
    }
    if (cleanQr !== undefined) {
      updateQuery += ', payment_barcode_image = ?';
      queryParams.push(cleanQr);
    }
    if (isShowUpi !== undefined) {
      updateQuery += ', show_upi = ?';
      queryParams.push(isShowUpi);
    }
    if (isShowQr !== undefined) {
      updateQuery += ', show_qr = ?';
      queryParams.push(isShowQr);
    }

    const settingsRow = await getAdminSettingsRow();
    if (settingsRow && settingsRow.id !== undefined) {
      updateQuery += ' WHERE id = ?';
      queryParams.push(settingsRow.id);
    }
    await db.query(updateQuery, queryParams);

    return res.json({
      success: '1',
      msg: 'UPI & QR Code configuration saved successfully!'
    });
  } catch (err) {
    console.error('setDefaultUpi error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Set Auto Deposit UPI ID (Direct UPI App Open)
exports.setAutoUpi = async (req, res) => {
  const { auto_upi_id } = req.body;
  if (!auto_upi_id || !auto_upi_id.trim()) {
    return res.status(400).json({ success: '0', msg: 'Auto Deposit UPI ID is required (e.g. autodeposit@paytm)' });
  }

  try {
    await initUpiSchema();
    const cleanUpi = auto_upi_id.trim();

    const settingsRow = await getAdminSettingsRow();
    if (settingsRow && settingsRow.id !== undefined) {
      await db.query('UPDATE admin_settings SET auto_upi_id = ?, deposit_mode = "upi_intent" WHERE id = ?', [cleanUpi, settingsRow.id]);
    } else {
      await db.query('UPDATE admin_settings SET auto_upi_id = ?, deposit_mode = "upi_intent"');
    }

    // Also sync all upi_gateways rows so any intent lookups use this clean auto UPI ID
    await db.query('UPDATE upi_gateways SET upi_id = ?', [cleanUpi]);

    return res.json({
      success: '1',
      msg: 'Auto Deposit UPI ID saved successfully!',
      auto_upi_id: cleanUpi
    });
  } catch (err) {
    console.error('setAutoUpi error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Set Deposit Mode ('upi_intent' or 'manual')
exports.setDepositMode = async (req, res) => {
  const { deposit_mode } = req.body;
  if (!deposit_mode) {
    return res.status(400).json({ success: '0', msg: 'Deposit mode is required' });
  }

  try {
    await initUpiSchema();
    const mode = deposit_mode.toLowerCase();
    const settingsRow = await getAdminSettingsRow();
    if (settingsRow && settingsRow.id !== undefined) {
      await db.query('UPDATE admin_settings SET deposit_mode = ? WHERE id = ?', [mode, settingsRow.id]);
    } else {
      await db.query('UPDATE admin_settings SET deposit_mode = ?', [mode]);
    }

    return res.json({
      success: '1',
      msg: `Deposit mode updated to ${mode.toUpperCase()}`,
      deposit_mode: mode
    });
  } catch (err) {
    console.error('setDepositMode error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Helper: Direct wallet credit & transaction settlement for automated payments
async function creditUserWalletDirect(username, amount, orderId, utr, note) {
  const cleanPhone = String(username || '').replace(/\D/g, '').slice(-10);
  const [users] = await db.query(
    "SELECT id, phone, name, wallet FROM user_info WHERE phone = ? OR RIGHT(phone, 10) = ? OR id = ? LIMIT 1",
    [username, cleanPhone, username]
  );
  if (users.length === 0) return { credited: false, msg: 'User account not found' };

  const user = users[0];
  const oldWallet = parseFloat(user.wallet || '0');
  const addAmt = parseFloat(amount || '0');
  const safeOldWallet = isNaN(oldWallet) ? 0 : oldWallet;
  const newWallet = safeOldWallet + addAmt;

  // 1. Update user_info wallet balance
  await db.query("UPDATE user_info SET wallet = ? WHERE id = ?", [newWallet, user.id]);

  const todayDateTime = getISTDateTimeStr();
  const currentDateStr = getISTDateStr();

  // 2. Mark user_auto_deposite status as 1 (Approved)
  await db.query(
    "UPDATE user_auto_deposite SET status = '1', txt_id = ? WHERE txt_request = ? AND (username = ? OR RIGHT(username, 10) = ?)",
    [utr || orderId, orderId, username, cleanPhone]
  );

  // 3. Insert or update user_fund_request so it shows in reports & passes through statement
  await db.query(
    "INSERT INTO user_fund_request (username, points, amount, trans_details, receipe_image, date, status, action) VALUES (?, ?, ?, ?, '', ?, '1', 'auto')",
    [user.phone, addAmt, addAmt, `${note || 'Auto Payment'} | Ref: ${utr || orderId}`, currentDateStr]
  );

  // 4. Broadcast live notification to Admin & User socket
  try {
    const { broadcastToAdmins } = require('../socket/chatSocket');
    broadcastToAdmins({
      type: 'badge_update',
      event: 'auto_deposit_approved',
      user: user.phone,
      amount: addAmt,
      utr: utr || orderId,
      message: `Auto Deposit Success: ₹${addAmt} credited to ${user.phone}`
    });
  } catch (wsErr) {}

  return { credited: true, newWallet };
}

// Admin: Set Active Auto Payment Gateway (NiceUpi, IMB, ZenUpi)
exports.setActiveGateway = async (req, res) => {
  const { gateway_code } = req.body;
  if (!gateway_code) {
    return res.status(400).json({ success: '0', msg: 'Gateway code is required (e.g. niceupi, imb, zenupi)' });
  }

  const cleanCode = String(gateway_code).trim().toLowerCase();
  try {
    await initUpiSchema();

    const [found] = await db.query('SELECT * FROM auto_payment_gateways WHERE gateway_code = ?', [cleanCode]);
    if (found.length === 0) {
      return res.status(404).json({ success: '0', msg: `Unknown gateway: ${cleanCode}` });
    }

    const gateway = found[0];

    // Deactivate all, activate selected
    await db.query('UPDATE auto_payment_gateways SET is_active = 0');
    await db.query('UPDATE auto_payment_gateways SET is_active = 1 WHERE gateway_code = ?', [cleanCode]);

    // Sync admin_settings
    const settingsRow = await getAdminSettingsRow();
    if (settingsRow && settingsRow.id !== undefined) {
      await db.query('UPDATE admin_settings SET active_payment_gateway = ?, deposit_mode = "upi_intent" WHERE id = ?', [cleanCode, settingsRow.id]);
    } else {
      await db.query('UPDATE admin_settings SET active_payment_gateway = ?, deposit_mode = "upi_intent"', [cleanCode]);
    }

    return res.json({
      success: '1',
      msg: `"${gateway.gateway_name}" is now the ACTIVE payment gateway on User End!`,
      active_payment_gateway: cleanCode
    });
  } catch (err) {
    console.error('setActiveGateway error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Update Gateway API Token & Configuration
exports.updateGatewayConfig = async (req, res) => {
  const { gateway_code, api_token, user_token, merchant_id, webhook_url, is_active } = req.body;
  if (!gateway_code) {
    return res.status(400).json({ success: '0', msg: 'Gateway code is required' });
  }

  const cleanCode = String(gateway_code).trim().toLowerCase();
  try {
    await initUpiSchema();

    const [found] = await db.query('SELECT * FROM auto_payment_gateways WHERE gateway_code = ?', [cleanCode]);
    if (found.length === 0) {
      return res.status(404).json({ success: '0', msg: 'Gateway not found' });
    }

    const current = found[0];
    const newApiToken = api_token !== undefined ? String(api_token).trim() : current.api_token;
    const newUserToken = user_token !== undefined ? String(user_token).trim() : (current.user_token || '');
    const newMerchantId = merchant_id !== undefined ? String(merchant_id).trim() : current.merchant_id;
    const newWebhookUrl = webhook_url !== undefined ? String(webhook_url).trim() : current.webhook_url;

    await db.query(
      'UPDATE auto_payment_gateways SET api_token = ?, user_token = ?, merchant_id = ?, webhook_url = ? WHERE gateway_code = ?',
      [newApiToken, newUserToken, newMerchantId, newWebhookUrl, cleanCode]
    );

    if (is_active) {
      await db.query('UPDATE auto_payment_gateways SET is_active = 0');
      await db.query('UPDATE auto_payment_gateways SET is_active = 1 WHERE gateway_code = ?', [cleanCode]);
      const settingsRow = await getAdminSettingsRow();
      if (settingsRow && settingsRow.id !== undefined) {
        await db.query('UPDATE admin_settings SET active_payment_gateway = ? WHERE id = ?', [cleanCode, settingsRow.id]);
      } else {
        await db.query('UPDATE admin_settings SET active_payment_gateway = ?', [cleanCode]);
      }
    }

    return res.json({
      success: '1',
      msg: `"${current.gateway_name}" credentials (User_token & API Token) saved successfully!`,
      gateway_code: cleanCode
    });
  } catch (err) {
    console.error('updateGatewayConfig error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Admin: Test Gateway API Connection
exports.testGatewayConnection = async (req, res) => {
  const { gateway_code, api_token, user_token } = req.body;
  if (!gateway_code) {
    return res.status(400).json({ success: '0', msg: 'Gateway code is required' });
  }

  const cleanCode = String(gateway_code).trim().toLowerCase();
  try {
    await initUpiSchema();
    const [found] = await db.query('SELECT * FROM auto_payment_gateways WHERE gateway_code = ?', [cleanCode]);
    const gateway = found[0] || {};
    const aToken = (api_token || gateway.api_token || '').trim();
    const uToken = (user_token || gateway.user_token || '').trim();

    if (!aToken && !uToken) {
      return res.json({ success: '0', msg: 'Please enter User Token or API Token first.' });
    }

    if (cleanCode === 'niceupi') {
      try {
        const postData = new URLSearchParams();
        if (uToken) postData.append('user_token', uToken);
        else if (aToken) postData.append('user_token', aToken);

        if (aToken) postData.append('api_token', aToken);
        else if (uToken) postData.append('api_token', uToken);

        postData.append('order_id', 'TEST_' + Date.now());

        const response = await fetch('https://niceupi.com/api/check-order-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: postData.toString()
        });

        const data = await response.json();
        if (data.status === 'ERROR' && /token|auth|unauthorized|invalid/i.test(data.message || data.msg || '')) {
          return res.json({ success: '0', msg: `NiceUpi API rejected token: ${data.message || data.msg || 'Invalid Token'}` });
        }

        return res.json({
          success: '1',
          msg: 'Connection to NiceUpi API successful! Tokens verified.',
          details: data
        });
      } catch (connErr) {
        return res.json({
          success: '0',
          msg: `Could not reach NiceUpi API: ${connErr.message}`
        });
      }
    }

    if (cleanCode === 'imb') {
      try {
        const postData = new URLSearchParams();
        postData.append('customer_mobile', '9999999999');
        postData.append('user_token', uToken || aToken);
        postData.append('amount', '1');
        postData.append('order_id', 'TEST_' + Date.now());
        postData.append('redirect_url', 'https://bharat-matka.onrender.com');
        postData.append('remark1', 'test@bharatmatka.com');
        postData.append('remark2', 'Test Connection');

        const response = await fetch('https://api.imbpay.in/v2/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: postData.toString()
        });

        const data = await response.json();
        if (data.status === false && /token|auth|unauthorized|invalid/i.test(data.message || data.msg || '')) {
          return res.json({ success: '0', msg: `IMB API rejected token: ${data.message || 'Invalid user_token'}` });
        }

        return res.json({
          success: '1',
          msg: 'Connection to IMB Payment Gateway verified successfully!',
          details: data
        });
      } catch (connErr) {
        return res.json({
          success: '0',
          msg: `Could not reach IMB API: ${connErr.message}`
        });
      }
    }

    return res.json({
      success: '1',
      msg: `Tokens validated for ${gateway.gateway_name || cleanCode}.`
    });
  } catch (err) {
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Public/Webhook: Handle Inbound Gateway Webhooks (NiceUpi, IMB, ZenUpi)
exports.handleWebhook = async (req, res) => {
  try {
    await initUpiSchema();
    const gateway = (req.params.gateway || '').toLowerCase();
    const payload = req.body || {};
    console.log(`[Webhook Received for ${gateway}]:`, payload);

    const resultObj = payload.result || {};
    const orderId =
      payload.order_id ||
      payload.orderId ||
      resultObj.orderId ||
      resultObj.order_id ||
      payload.client_txn_id ||
      payload.txn_id ||
      payload.txId;

    const utr =
      resultObj.utr ||
      payload.utr ||
      payload.utr_number ||
      payload.bank_ref_no ||
      payload.ref_id ||
      'WEBHOOK_PAID';

    const amount = parseFloat(
      resultObj.amount ||
      payload.amount ||
      payload.txn_amount ||
      payload.points ||
      0
    );

    const status = String(
      resultObj.txnStatus ||
      payload.status ||
      payload.txn_status ||
      ''
    ).toUpperCase();

    const isSuccess =
      status === 'COMPLETED' ||
      status === 'SUCCESS' ||
      status === 'SUCCESSFUL' ||
      status === 'PAID' ||
      payload.status === true ||
      payload.status === 1 ||
      payload.status === '1';

    if (!orderId) {
      return res.status(400).json({ status: 'error', message: 'Order ID is required' });
    }

    if (!isSuccess) {
      console.log(`[Webhook]: Order ${orderId} status is ${status}, skipping credit.`);
      return res.json({ status: 'ignored', message: `Order status is ${status}` });
    }

    // Check if order already in user_auto_deposite
    let [existing] = await db.query(
      "SELECT * FROM user_auto_deposite WHERE txt_request = ? LIMIT 1",
      [orderId]
    );

    let targetUsername = null;
    let targetAmount = amount;

    if (existing.length > 0) {
      const order = existing[0];
      if (order.status === '1') {
        return res.json({ status: 'already_processed', message: 'Order already credited' });
      }
      targetUsername = order.username;
      targetAmount = amount > 0 ? amount : parseFloat(order.amount || 0);
    } else {
      // Fallback: look up by customer_mobile
      const mob = resultObj.customer_mobile || payload.customer_mobile;
      if (mob) {
        const cleanMob = String(mob).replace(/\D/g, '').slice(-10);
        const [userPending] = await db.query(
          "SELECT * FROM user_auto_deposite WHERE (username = ? OR RIGHT(username, 10) = ?) AND status = '0' ORDER BY id DESC LIMIT 1",
          [mob, cleanMob]
        );
        if (userPending.length > 0) {
          const matchedOrder = userPending[0];
          targetUsername = matchedOrder.username;
          targetAmount = amount > 0 ? amount : parseFloat(matchedOrder.amount || 0);
        }
      }
    }

    if (!targetUsername) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const creditResult = await creditUserWalletDirect(
      targetUsername,
      targetAmount,
      orderId,
      utr,
      `${(gateway || 'IMB').toUpperCase()} Webhook`
    );

    return res.json({
      status: 'success',
      message: 'Deposit credited successfully',
      wallet: creditResult.newWallet
    });
  } catch (err) {
    console.error('handleWebhook error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// User/Public: Get Active UPI Apps & Deposit Configuration
exports.getPublicPaymentConfig = async (req, res) => {
  try {
    await initUpiSchema();

    const settings = await getAdminSettingsRow();

    const depositMode = settings?.deposit_mode || 'upi_intent';
    const isAuto = depositMode === 'upi_intent' || depositMode === 'auto';
    const autoUpi = settings?.auto_upi_id || '';
    const defaultUpi = settings?.payment_upi_id || settings?.upi_payment_id || '';
    // In auto mode, automated gateway handles orders - do NOT fall back to manual default UPI ID!
    const activeUpi = isAuto ? (autoUpi || '') : defaultUpi;
    const payeeName = settings?.ac_name || 'Pravesh Online';

    // Get active gateway from auto_payment_gateways
    const [activeGwRows] = await db.query('SELECT * FROM auto_payment_gateways WHERE is_active = 1 LIMIT 1');
    const activeGw = activeGwRows && activeGwRows[0] ? activeGwRows[0] : null;
    const activeGatewayCode = activeGw?.gateway_code || settings?.active_payment_gateway || 'niceupi';
    const activeGatewayName = activeGw?.gateway_name || 'NiceUpi';
    const isConfigured = Boolean((activeGw?.api_token && activeGw.api_token.trim().length > 3) || (activeGw?.user_token && activeGw.user_token.trim().length > 3));

    // Get all auto gateways safe public summary
    const [allAutoGws] = await db.query('SELECT gateway_code, gateway_name, is_active FROM auto_payment_gateways ORDER BY id ASC');

    // Get active UPI apps
    const [upiApps] = await db.query(
      'SELECT id, app_name, app_code, upi_id, payee_name, display_order FROM upi_gateways WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    return res.json({
      success: '1',
      deposit_mode: depositMode,
      auto_upi_id: autoUpi,
      default_upi_id: defaultUpi,
      active_upi_id: activeUpi,
      payee_name: payeeName,
      min_deposite: settings?.min_deposite || '100',
      max_deposite: settings?.max_deposite || '50000',
      payment_barcode_image: settings?.payment_barcode_image || '',
      show_upi: settings?.show_upi ?? 1,
      show_qr: settings?.show_qr ?? 1,
      upi_apps: upiApps,
      active_payment_gateway: activeGatewayCode,
      active_gateway: {
        id: activeGatewayCode,
        gateway_code: activeGatewayCode,
        name: activeGatewayName,
        gateway_name: activeGatewayName,
        is_configured: isConfigured,
        category: 'Automated Gateway',
        description: `Automated instant payment via ${activeGatewayName}`
      },
      gateways_list: allAutoGws
    });
  } catch (err) {
    console.error('getPublicPaymentConfig error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// Helper: Build UPI URI deep link
function buildUpiUri(appCode, upiId, payeeName, amount, orderId) {
  const encUpi = encodeURIComponent(upiId);
  const encName = encodeURIComponent(payeeName || 'Pravesh');
  const encNote = encodeURIComponent(orderId);
  const formattedAmount = Number(amount).toFixed(2);
  const baseQuery = `pa=${encUpi}&pn=${encName}&am=${formattedAmount}&cu=INR&tn=${encNote}&tr=${encNote}`;

  switch (appCode) {
    case 'phonepe':
      return {
        scheme_url: `phonepe://pay?${baseQuery}`,
        intent_url: `intent://pay?${baseQuery}#Intent;scheme=upi;package=com.phonepe.app;end`,
        generic_url: `upi://pay?${baseQuery}`
      };
    case 'gpay':
    case 'googlepay':
      return {
        scheme_url: `tez://upi/pay?${baseQuery}`,
        intent_url: `intent://pay?${baseQuery}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
        generic_url: `upi://pay?${baseQuery}`
      };
    case 'paytm':
      return {
        scheme_url: `paytmmp://pay?${baseQuery}`,
        intent_url: `intent://pay?${baseQuery}#Intent;scheme=upi;package=net.one97.paytm;end`,
        generic_url: `upi://pay?${baseQuery}`
      };
    case 'bhim':
      return {
        scheme_url: `bhim://pay?${baseQuery}`,
        intent_url: `intent://pay?${baseQuery}#Intent;scheme=upi;package=in.org.npci.upiapp;end`,
        generic_url: `upi://pay?${baseQuery}`
      };
    default:
      return {
        scheme_url: `upi://pay?${baseQuery}`,
        intent_url: `intent://pay?${baseQuery}#Intent;scheme=upi;end`,
        generic_url: `upi://pay?${baseQuery}`
      };
  }
}

// User Protected: Create Payment Order (NiceUpi, IMB, ZenUpi or Direct UPI Intent)
exports.createOrder = async (req, res) => {
  const phone = req.user.phone;
  const name = req.user.name || 'User';
  const { amount, app_id, app_code, upi_id } = req.body;

  const numAmount = parseFloat(parseFloat(amount).toFixed(2));
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.json({ success: '0', msg: 'Please enter a valid deposit amount.' });
  }

  try {
    await initUpiSchema();

    const settings = await getAdminSettingsRow();
    const minDep = parseFloat(settings?.min_deposite || '100');
    const maxDep = parseFloat(settings?.max_deposite || '50000');

    if (numAmount < minDep) {
      return res.json({ success: '0', msg: `Minimum deposit amount is ₹${minDep.toFixed(2)}.` });
    }
    if (numAmount > maxDep) {
      return res.json({ success: '0', msg: `Maximum deposit amount is ₹${maxDep.toFixed(2)}.` });
    }

    const depositMode = settings?.deposit_mode || 'upi_intent';
    const isAuto = depositMode === 'upi_intent' || depositMode === 'auto';

    // 1. If in Auto Deposit Mode, route through the Admin's selected Active Gateway
    if (isAuto) {
      const [activeGwRows] = await db.query(
        'SELECT * FROM auto_payment_gateways WHERE is_active = 1 LIMIT 1'
      );
      const activeGw = activeGwRows && activeGwRows[0] ? activeGwRows[0] : null;
      const gwCode = activeGw?.gateway_code || settings?.active_payment_gateway || 'niceupi';

      const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10) || '9999999999';
      const host = req.get('host') || 'bharat-matka.onrender.com';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const redirectUrl = `${protocol}://${host}/wallet`;

      // ----------------------------------------------------
      // GATEWAY 1: NiceUpi Automated Gateway
      // ----------------------------------------------------
      if (gwCode === 'niceupi') {
        const uToken = (activeGw?.user_token || '').trim();
        const aToken = (activeGw?.api_token || '').trim();
        const primaryToken = uToken || aToken;

        if (!primaryToken) {
          return res.json({
            success: '0',
            msg: 'NiceUpi User_token is not configured by Admin. Please enter User_token in Admin Panel -> Payment Gateway.'
          });
        }

        const orderId = `BM_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

        try {
          const postData = new URLSearchParams();
          // NiceUpi expects user_token parameter
          if (uToken) {
            postData.append('user_token', uToken);
          } else if (aToken) {
            postData.append('user_token', aToken);
          }

          // Also supply api_token for full compatibility
          if (aToken) {
            postData.append('api_token', aToken);
          } else if (uToken) {
            postData.append('api_token', uToken);
          }

          postData.append('customer_mobile', cleanPhone);
          postData.append('amount', String(numAmount));
          postData.append('order_id', orderId);
          postData.append('redirect_url', redirectUrl);
          postData.append('remark', 'Bharat Matka Fund');

          const apiRes = await fetch('https://niceupi.com/api/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            body: postData.toString()
          });

          const apiData = await apiRes.json();
          console.log('[NiceUpi create-order response]:', apiData);

          const isSuccess =
            apiData.status === true ||
            apiData.status === 'success' ||
            apiData.status === 'SUCCESS' ||
            apiData.status === 200 ||
            apiData.status === '1';

          const paymentUrl = apiData.payment_url || apiData.data?.payment_url || apiData.url || apiData.checkout_url;
          const intentUrl = apiData.intent_url || apiData.data?.intent_url || apiData.upi_intent_url || paymentUrl;
          const qrCode = apiData.qr_code || apiData.data?.qr_code || apiData.qr || '';

          let phonepeUrl = '';
          let paytmUrl = '';
          let gpayUrl = '';
          const upiBase = (intentUrl && intentUrl.startsWith('upi://pay?')) ? intentUrl : (paymentUrl && paymentUrl.startsWith('upi://pay?') ? paymentUrl : '');
          if (upiBase) {
            phonepeUrl = upiBase.replace(/^upi:\/\/pay\?/, 'phonepe://pay?');
            paytmUrl = upiBase.replace(/^upi:\/\/pay\?/, 'paytmmp://pay?');
            gpayUrl = upiBase.replace(/^upi:\/\/pay\?/, 'tez://upi/pay?');
          }

          if (isSuccess && (paymentUrl || intentUrl)) {
            const todayDateTime = getISTDateTimeStr();
            await db.query(
              `INSERT INTO user_auto_deposite (username, transaction_note, amount, txt_request, txt_id, txt_date, status)
               VALUES (?, ?, ?, ?, '0', ?, '0')`,
              [phone, `NiceUpi Auto Deposit | Order: ${orderId}`, numAmount, orderId, todayDateTime]
            );

            return res.json({
              success: '1',
              msg: 'NiceUpi payment order created successfully',
              data: {
                gateway: 'niceupi',
                gateway_name: 'NiceUpi',
                order_id: orderId,
                amount: numAmount,
                payment_url: paymentUrl,
                intent_url: intentUrl,
                phonepe_url: phonepeUrl,
                paytm_url: paytmUrl,
                gpay_url: gpayUrl,
                qr_code: qrCode,
                generic_upi_url: intentUrl || paymentUrl,
                upi_url: intentUrl || paymentUrl,
                user: { name, phone }
              }
            });
          } else {
            const errReason = apiData.message || apiData.msg || apiData.error || 'Failed to create NiceUpi payment order';
            let friendlyMsg = `NiceUpi Gateway: ${errReason}`;
            if (String(errReason).toLowerCase().includes('merchant not linked')) {
              friendlyMsg = 'NiceUpi Gateway: Merchant Not Linked. Please log in to your NiceUpi Merchant Dashboard (https://niceupi.com/merchant/dashboard), go to the "Merchants" section, and connect/link your UPI Merchant account.';
            }
            return res.json({
              success: '0',
              msg: friendlyMsg
            });
          }
        } catch (fetchErr) {
          console.error('NiceUpi create-order error:', fetchErr);
          return res.json({
            success: '0',
            msg: `Unable to connect to NiceUpi API: ${fetchErr.message}`
          });
        }
      }

      // ----------------------------------------------------
      // GATEWAY 2: IMB Payment Gateway
      // ----------------------------------------------------
      if (gwCode === 'imb') {
        const uToken = (activeGw?.user_token || '').trim();
        const aToken = (activeGw?.api_token || '').trim();
        const primaryToken = uToken || aToken;

        if (!primaryToken) {
          return res.json({
            success: '0',
            msg: 'IMB Payment Gateway user_token is not configured by Admin. Please enter User Token / API Token in Admin Panel -> Payment Gateway.'
          });
        }

        const orderId = `IMB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

        try {
          const postData = new URLSearchParams();
          postData.append('customer_mobile', cleanPhone);
          postData.append('user_token', primaryToken);
          postData.append('amount', String(numAmount));
          postData.append('order_id', orderId);
          postData.append('redirect_url', redirectUrl);
          postData.append('remark1', `${cleanPhone}@bharatmatka.com`);
          postData.append('remark2', 'Bharat Matka Fund');

          const apiRes = await fetch('https://api.imbpay.in/v2/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            body: postData.toString()
          });

          const apiData = await apiRes.json();
          console.log('[IMB create-order response]:', apiData);

          const isSuccess =
            apiData.status === true ||
            apiData.status === 'true' ||
            apiData.status === 'SUCCESS' ||
            apiData.status === 'success' ||
            apiData.status === 200;

          const result = apiData.result || apiData.data || {};
          const paymentUrl = result.payment_url || apiData.payment_url || '';
          const paytmLink = result.paytm_link || '';
          const bhimLink = result.bhim_link || '';
          const phonepeLink = result.phonepe_link || (bhimLink && bhimLink.startsWith('upi://pay?') ? bhimLink.replace(/^upi:\/\/pay\?/, 'phonepe://pay?') : '');
          const checkLink = result.check_link || '';
          const intentUrl = paymentUrl || phonepeLink || paytmLink || bhimLink;
          const genericUpiUrl = bhimLink || intentUrl;
          let gpayLink = '';
          if (bhimLink && bhimLink.startsWith('upi://pay?')) {
            gpayLink = bhimLink.replace(/^upi:\/\/pay\?/, 'tez://upi/pay?');
          } else if (phonepeLink && phonepeLink.startsWith('phonepe://pay?')) {
            gpayLink = phonepeLink.replace(/^phonepe:\/\/pay\?/, 'tez://upi/pay?');
          }

          if (isSuccess && (paymentUrl || bhimLink || phonepeLink || paytmLink)) {
            const todayDateTime = getISTDateTimeStr();
            await db.query(
              `INSERT INTO user_auto_deposite (username, transaction_note, amount, txt_request, txt_id, txt_date, status)
               VALUES (?, ?, ?, ?, '0', ?, '0')`,
              [phone, `IMB Auto Deposit | Order: ${orderId}`, numAmount, orderId, todayDateTime]
            );

            return res.json({
              success: '1',
              msg: 'IMB payment order created successfully',
              data: {
                gateway: 'imb',
                gateway_name: 'IMB Payment Gateway',
                order_id: result.orderId || orderId,
                amount: numAmount,
                payment_url: paymentUrl,
                intent_url: intentUrl,
                phonepe_url: phonepeLink,
                paytm_url: paytmLink,
                gpay_url: gpayLink,
                bhim_url: bhimLink,
                generic_upi_url: genericUpiUrl,
                upi_url: genericUpiUrl,
                check_link: checkLink,
                user: { name, phone }
              }
            });
          } else {
            const errReason = apiData.message || apiData.msg || apiData.error || 'Failed to create IMB payment order';
            return res.json({
              success: '0',
              msg: `IMB Payment Gateway: ${errReason}`
            });
          }
        } catch (fetchErr) {
          console.error('IMB create-order error:', fetchErr);
          return res.json({
            success: '0',
            msg: `Unable to connect to IMB API: ${fetchErr.message}`
          });
        }
      }

      // ----------------------------------------------------
      // GATEWAY 3: ZenUpi Gateway
      // ----------------------------------------------------
      if (gwCode === 'zenupi') {
        const token = (activeGw?.api_token || '').trim();
        if (!token) {
          return res.json({
            success: '0',
            msg: 'ZenUpi API Token is not configured by Admin. Please configure API Token in Admin Panel.'
          });
        }

        const orderId = `ZEN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const todayDateTime = getISTDateTimeStr();
        await db.query(
          `INSERT INTO user_auto_deposite (username, transaction_note, amount, txt_request, txt_id, txt_date, status)
           VALUES (?, ?, ?, ?, '0', ?, '0')`,
          [phone, `ZenUpi Auto Deposit | Order: ${orderId}`, numAmount, orderId, todayDateTime]
        );

        return res.json({
          success: '1',
          msg: 'ZenUpi payment order initiated',
          data: {
            gateway: 'zenupi',
            gateway_name: 'ZenUpi',
            order_id: orderId,
            amount: numAmount,
            user: { name, phone }
          }
        });
      }
    }

    // Determine target UPI ID (fallback for manual intent or direct UPI flow)
    let targetUpiId = settings?.auto_upi_id || upi_id || settings?.payment_upi_id || settings?.upi_payment_id || '';
    let targetPayee = settings?.ac_name || 'Pravesh Online';
    let targetAppName = 'UPI App';
    let targetAppCode = app_code || 'upi';

    if (app_id) {
      const [appRows] = await db.query('SELECT * FROM upi_gateways WHERE id = ? LIMIT 1', [app_id]);
      if (appRows.length > 0) {
        const app = appRows[0];
        targetUpiId = settings?.auto_upi_id || app.upi_id || targetUpiId;
        targetPayee = app.payee_name || targetPayee;
        targetAppName = app.app_name;
        targetAppCode = app.app_code;
      }
    } else if (app_code && app_code !== 'upi') {
      const [appRows] = await db.query('SELECT * FROM upi_gateways WHERE app_code = ? AND is_active = 1 LIMIT 1', [app_code]);
      if (appRows.length > 0) {
        const app = appRows[0];
        targetUpiId = settings?.auto_upi_id || app.upi_id || targetUpiId;
        targetPayee = app.payee_name || targetPayee;
        targetAppName = app.app_name;
      }
    }

    if (!targetUpiId) {
      const [activeRows] = await db.query('SELECT * FROM upi_gateways WHERE is_active = 1 AND upi_id != "" ORDER BY display_order ASC LIMIT 1');
      if (activeRows.length > 0) {
        targetUpiId = activeRows[0].upi_id;
        targetPayee = activeRows[0].payee_name || targetPayee;
      }
    }

    if (!targetUpiId) {
      return res.json({ success: '0', msg: 'Payment Gateway is not configured. Please contact support.' });
    }

    const orderId = `UPI_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const urls = buildUpiUri(targetAppCode, targetUpiId, targetPayee, numAmount, orderId);
    const phonepeUrls = buildUpiUri('phonepe', targetUpiId, targetPayee, numAmount, orderId);
    const paytmUrls = buildUpiUri('paytm', targetUpiId, targetPayee, numAmount, orderId);
    const gpayUrls = buildUpiUri('gpay', targetUpiId, targetPayee, numAmount, orderId);

    return res.json({
      success: '1',
      msg: 'UPI Intent generated successfully',
      data: {
        order_id: orderId,
        amount: numAmount,
        upi_id: targetUpiId,
        payee_name: targetPayee,
        app_name: targetAppName,
        app_code: targetAppCode,
        upi_url: urls.scheme_url,
        phonepe_url: phonepeUrls.scheme_url,
        paytm_url: paytmUrls.scheme_url,
        gpay_url: gpayUrls.scheme_url,
        generic_upi_url: urls.generic_url,
        intent_url: urls.intent_url,
        user: { name, phone }
      }
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};

// User Protected: Submit UPI Deposit with UTR Number & optional Screenshot
exports.submitUpiFundRequest = async (req, res) => {
  const phone = req.user.phone;
  const name = req.user.name || 'User';
  const { amount, utr_no, order_id, image, upi_app } = req.body;

  const amtNum = parseFloat(amount);
  if (isNaN(amtNum) || amtNum <= 0) {
    return res.json({ success: '0', msg: 'Please enter a valid deposit amount.' });
  }

  const cleanUtr = (utr_no || '').replace(/\D/g, '').trim();
  if (!cleanUtr) {
    return res.json({ success: '0', msg: 'Please enter the 12-digit UTR reference number.' });
  }

  if (cleanUtr.length !== 12) {
    return res.json({
      success: '0',
      msg: `UTR number must be exactly 12 digits (currently ${cleanUtr.length} digits).`
    });
  }

  // Reject dummy repeating numbers like 000000000000 or sequential numbers like 123456789012
  if (/^(\d)\1{11}$/.test(cleanUtr) || cleanUtr === '123456789012' || cleanUtr === '012345678901') {
    return res.json({
      success: '0',
      msg: 'Invalid UTR Number. Dummy or repeated numbers are not accepted.'
    });
  }

  try {
    await initUpiSchema();

    // Verify min and max deposit limits
    const settings = await getAdminSettingsRow();
    const minDep = parseFloat(settings?.min_deposite || '100');
    const maxDep = parseFloat(settings?.max_deposite || '50000');

    if (amtNum < minDep) {
      return res.json({
        success: '0',
        msg: `Minimum deposit amount is ₹${minDep.toFixed(2)}.`
      });
    }
    if (amtNum > maxDep) {
      return res.json({
        success: '0',
        msg: `Maximum deposit amount is ₹${maxDep.toFixed(2)}.`
      });
    }

    // Ensure txt_id column is VARCHAR so 12-digit UTR doesn't overflow MySQL INT
    try {
      await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_id VARCHAR(150) NOT NULL DEFAULT '0'`);
    } catch (e1) {
      try {
        await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_id VARCHAR(150) DEFAULT '0'`);
      } catch (e2) {
        try {
          await db.query(`ALTER TABLE user_auto_deposite MODIFY COLUMN txt_id BIGINT DEFAULT 0`);
        } catch (e3) {}
      }
    }

    // Check if this UTR has already been approved for another request
    const [existingApproved] = await db.query(
      "SELECT id FROM user_auto_deposite WHERE (CAST(txt_id AS CHAR) = ? OR txt_request = ? OR transaction_note LIKE ?) AND status = '1' LIMIT 1",
      [cleanUtr, cleanUtr, `%${cleanUtr}%`]
    );
    if (existingApproved.length > 0) {
      return res.json({
        success: '0',
        msg: 'This UTR number has already been used and approved for another deposit.'
      });
    }

    const [existingFund] = await db.query(
      "SELECT id FROM user_fund_request WHERE trans_details LIKE ? AND status = '1' LIMIT 1",
      [`%${cleanUtr}%`]
    );
    if (existingFund.length > 0) {
      return res.json({
        success: '0',
        msg: 'This UTR number has already been verified and credited.'
      });
    }

    let receipe_image = '';

    // Handle optional screenshot upload
    if (image && image.trim() !== '') {
      try {
        const uploadDir = path.join(__dirname, '..', '..', '_public_html (1)', 'uploads', 'fund');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileName = `UPI_${Date.now()}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        receipe_image = `uploads/fund/${fileName}`;
      } catch (fErr) {
        console.warn('Screenshot save warning:', fErr.message);
      }
    }

    const currentDateStr = getISTDateStr();
    const trans_details = `UPI: ${cleanUtr} (${upi_app || 'UPI App'})`;

    // 1. Insert into user_fund_request for Admin verification
    await db.query(
      `INSERT INTO user_fund_request (username, points, amount, trans_details, receipe_image, date, status, action)
       VALUES (?, ?, ?, ?, ?, ?, '0', '')`,
      [phone, amtNum, amtNum, trans_details, receipe_image, currentDateStr]
    );

    // 2. Insert or update user_auto_deposite so Admin sees it in Auto Deposit tab
    const todayDateTime = getISTDateTimeStr();
    const autoNote = `Auto UPI (${upi_app || 'UPI App'}) | UTR: ${cleanUtr}`;
    const txtReq = order_id || `UPI_${cleanUtr}`;
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    try {
      let updated = false;
      if (order_id) {
        const [upd] = await db.query(
          `UPDATE user_auto_deposite SET txt_id = ?, transaction_note = CONCAT(transaction_note, ' | UTR: ', ?) WHERE txt_request = ? AND (username = ? OR RIGHT(username, 10) = ?)`,
          [cleanUtr, cleanUtr, order_id, phone, cleanPhone || phone]
        );
        if (upd.affectedRows > 0) updated = true;
      }
      if (!updated) {
        await db.query(
          `INSERT INTO user_auto_deposite (username, transaction_note, amount, txt_request, txt_id, txt_date, status)
           VALUES (?, ?, ?, ?, ?, ?, '0')`,
          [phone, autoNote, amtNum, txtReq, cleanUtr, todayDateTime]
        );
      }
    } catch (depErr) {
      console.warn('user_auto_deposite update/insert error in submitUpiFundRequest:', depErr.message);
    }

    try {
      const { broadcastToAdmins } = require('../socket/chatSocket');
      broadcastToAdmins({
        type: 'badge_update',
        event: 'new_deposit',
        user: phone,
        amount: amtNum,
        utr: cleanUtr,
        message: `New Deposit Request: ₹${amtNum} from ${phone}`
      });
    } catch (wsErr) {}

    return res.json({
      success: '1',
      msg: 'Deposit Request with UTR submitted successfully! Wallet will be credited shortly upon admin verification.'
    });
  } catch (err) {
    console.error('submitUpiFundRequest error:', err);
    return res.json({
      success: '0',
      msg: 'Unable to submit deposit request right now. Please check your 12-digit reference number and try again.'
    });
  }
};

// User Protected: Check Payment Status (DOES NOT auto-approve; stays pending until Admin approves)
exports.verifyPayment = async (req, res) => {
  const phone = req.user.phone;
  const { order_id, payment_id, amount, utr_no } = req.body;

  const refId = payment_id || utr_no || order_id;
  if (!refId) {
    return res.json({ success: '0', msg: 'Reference ID is required.' });
  }

  const numAmount = parseFloat(amount);

  try {
    await initUpiSchema();

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    // 1. Check if Admin has already approved this record in user_auto_deposite or user_fund_request
    const [approvedAuto] = await db.query(
      `SELECT * FROM user_auto_deposite 
       WHERE (txt_request = ? OR txt_id = ? OR transaction_note LIKE ?) 
         AND (username = ? OR RIGHT(username, 10) = ?) 
         AND status = '1' 
       LIMIT 1`,
      [order_id || refId, refId, `%${refId}%`, phone, cleanPhone || phone]
    );

    const [approvedFund] = await db.query(
      `SELECT * FROM user_fund_request 
       WHERE trans_details LIKE ? 
         AND (username = ? OR RIGHT(username, 10) = ?) 
         AND status = '1' 
       LIMIT 1`,
      [`%${order_id || refId}%`, phone, cleanPhone || phone]
    );

    if (approvedAuto.length > 0 || approvedFund.length > 0) {
      const [uRows] = await db.query(
        "SELECT wallet FROM user_info WHERE phone = ? OR RIGHT(phone, 10) = ? LIMIT 1",
        [phone, cleanPhone || phone]
      );
      return res.json({ 
        success: '1', 
        approved: true,
        status: '1',
        msg: 'Payment has been approved and credited to your wallet!',
        wallet: uRows.length > 0 ? parseFloat(uRows[0].wallet || '0') : undefined
      });
    }

    // 2. Real-time Status Verification with NiceUpi API
    const targetOrderId = order_id || refId;
    if (targetOrderId && String(targetOrderId).startsWith('BM_')) {
      try {
        const [niceRows] = await db.query("SELECT api_token, user_token FROM auto_payment_gateways WHERE gateway_code = 'niceupi' LIMIT 1");
        const niceRow = niceRows[0];
        const uToken = (niceRow?.user_token || '').trim();
        const aToken = (niceRow?.api_token || '').trim();
        const primaryToken = uToken || aToken;

        if (primaryToken) {
          const postData = new URLSearchParams();
          if (uToken) postData.append('user_token', uToken);
          else if (aToken) postData.append('user_token', aToken);

          if (aToken) postData.append('api_token', aToken);
          else if (uToken) postData.append('api_token', uToken);

          postData.append('order_id', targetOrderId);

          const statusRes = await fetch('https://niceupi.com/api/check-order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: postData.toString()
          });

          const statusData = await statusRes.json();
          console.log('[NiceUpi real-time status check]:', statusData);

          const isCompleted =
            statusData.status === 'COMPLETED' ||
            statusData.status === 'SUCCESS' ||
            statusData.status === true ||
            statusData.data?.status === 'COMPLETED' ||
            statusData.data?.status === 'SUCCESS';

          if (isCompleted) {
            const utr = statusData.utr || statusData.data?.utr || statusData.utr_number || 'NICEUPI_AUTO';
            const orderAmt = parseFloat(statusData.amount || statusData.data?.amount || amount || 0);

            const creditRes = await creditUserWalletDirect(
              phone,
              orderAmt,
              targetOrderId,
              utr,
              'NiceUpi Auto Payment'
            );

            if (creditRes.credited) {
              return res.json({
                success: '1',
                approved: true,
                status: '1',
                msg: `Payment of ₹${orderAmt} verified successfully via NiceUpi!`,
                wallet: creditRes.newWallet
              });
            }
          }
        }
      } catch (niceErr) {
        console.warn('NiceUpi check status API notice:', niceErr.message);
      }
    }

    // 2. Check if Admin rejected this record
    const [rejectedAuto] = await db.query(
      `SELECT * FROM user_auto_deposite 
       WHERE (txt_request = ? OR txt_id = ? OR transaction_note LIKE ?) 
         AND (username = ? OR RIGHT(username, 10) = ?) 
         AND status = '-1' 
       LIMIT 1`,
      [order_id || refId, refId, `%${refId}%`, phone, cleanPhone || phone]
    );

    const [rejectedFund] = await db.query(
      `SELECT * FROM user_fund_request 
       WHERE trans_details LIKE ? 
         AND (username = ? OR RIGHT(username, 10) = ?) 
         AND status = '-1' 
       LIMIT 1`,
      [`%${order_id || refId}%`, phone, cleanPhone || phone]
    );

    if (rejectedAuto.length > 0 || rejectedFund.length > 0) {
      return res.json({
        success: '0',
        rejected: true,
        status: '-1',
        msg: 'Your deposit request was declined by Admin. Please contact support or submit your 12-digit UTR.'
      });
    }

    // 3. If user provided a 12-digit UTR during verify, save it to the pending record so admin sees it
    if (utr_no && /^\d{12}$/.test(String(utr_no).trim())) {
      const cleanUtr = String(utr_no).trim();
      try {
        await db.query(
          `UPDATE user_auto_deposite 
           SET txt_id = ?, transaction_note = CONCAT(transaction_note, ' | UTR: ', ?) 
           WHERE txt_request = ? AND (username = ? OR RIGHT(username, 10) = ?) AND status = '0'`,
          [cleanUtr, cleanUtr, order_id || refId, phone, cleanPhone || phone]
        );
        await db.query(
          `UPDATE user_fund_request 
           SET trans_details = CONCAT(trans_details, ' | UTR: ', ?) 
           WHERE trans_details LIKE ? AND (username = ? OR RIGHT(username, 10) = ?) AND status = '0'`,
          [cleanUtr, `%${order_id || refId}%`, phone, cleanPhone || phone]
        );
      } catch (e) {}
    }

    // 4. Check if a real pending deposit request was submitted with UTR
    const [pendingAuto] = await db.query(
      `SELECT * FROM user_auto_deposite 
       WHERE (txt_request = ? OR txt_id = ? OR transaction_note LIKE ?) 
         AND (username = ? OR RIGHT(username, 10) = ?) 
         AND status = '0' 
       LIMIT 1`,
      [order_id || refId, refId, `%${refId}%`, phone, cleanPhone || phone]
    );

    const [pendingFund] = await db.query(
      `SELECT * FROM user_fund_request 
       WHERE trans_details LIKE ? 
         AND (username = ? OR RIGHT(username, 10) = ?) 
         AND status = '0' 
       LIMIT 1`,
      [`%${order_id || refId}%`, phone, cleanPhone || phone]
    );

    if (pendingAuto.length > 0 || pendingFund.length > 0) {
      return res.json({
        success: '1',
        approved: false,
        pending: true,
        status: '0',
        msg: 'Payment is pending confirmation from UPI gateway. Please complete payment in your UPI app.'
      });
    }

    // 5. Not submitted yet
    return res.json({
      success: '0',
      pending: false,
      not_submitted: true,
      msg: 'No deposit request submitted yet. If you have sent payment, please enter your 12-digit UTR to submit for Admin approval.'
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ success: '0', error: err.message });
  }
};
