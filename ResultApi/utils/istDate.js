// Helper functions for India Standard Time (IST / Asia/Kolkata / UTC+5:30)

function getISTComponents(d) {
  let dateObj = (d instanceof Date && !isNaN(d)) ? d : (d ? new Date(d) : new Date());
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  if (dateObj._isIST) {
    return {
      year: String(dateObj.getFullYear()),
      month: String(dateObj.getMonth() + 1).padStart(2, '0'),
      day: String(dateObj.getDate()).padStart(2, '0'),
      hour: String(dateObj.getHours()).padStart(2, '0'),
      minute: String(dateObj.getMinutes()).padStart(2, '0'),
      second: String(dateObj.getSeconds()).padStart(2, '0')
    };
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(dateObj);
  const p = {};
  for (const part of parts) {
    p[part.type] = part.value;
  }

  const hourNum = parseInt(p.hour, 10) % 24;
  const hour24 = String(hourNum).padStart(2, '0');

  return {
    year: p.year,
    month: p.month,
    day: p.day,
    hour: hour24,
    minute: p.minute,
    second: p.second
  };
}

function getISTDate(d) {
  if (d && d._isIST) return d;
  const { year, month, day, hour, minute, second } = getISTComponents(d);
  const istDate = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  );
  istDate._isIST = true;
  return istDate;
}

function getISTDateStr(d) {
  const { year, month, day } = getISTComponents(d);
  return `${year}-${month}-${day}`;
}

function getISTTimeStr(d) {
  const { hour, minute, second } = getISTComponents(d);
  return `${hour}:${minute}:${second}`;
}

function getISTTime12h(d, includeSeconds = false) {
  const { hour, minute, second } = getISTComponents(d);
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = String(h).padStart(2, '0');
  if (includeSeconds) {
    return `${hStr}:${minute}:${second} ${ampm}`;
  }
  return `${hStr}:${minute} ${ampm}`;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const clean = String(timeStr).trim().toLowerCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[4];
  if (modifier === 'pm' && hours < 12) {
    hours += 12;
  } else if (modifier === 'am' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

function compareMarketTimes(a, b) {
  const aTimeStr = a.open_time || a.open_time_str || a.openTime;
  const bTimeStr = b.open_time || b.open_time_str || b.openTime;
  const aMin = parseTimeToMinutes(aTimeStr);
  const bMin = parseTimeToMinutes(bTimeStr);

  if (aMin !== null && bMin !== null && aMin !== bMin) {
    return aMin - bMin;
  }
  if (aMin !== null && bMin === null) return -1;
  if (aMin === null && bMin !== null) return 1;

  const aClose = parseTimeToMinutes(a.close_time || a.closeTime);
  const bClose = parseTimeToMinutes(b.close_time || b.closeTime);
  if (aClose !== null && bClose !== null && aClose !== bClose) {
    return aClose - bClose;
  }

  const aName = (a.market_name || a.games_name || a.game || '').toLowerCase();
  const bName = (b.market_name || b.games_name || b.game || '').toLowerCase();
  return aName.localeCompare(bName);
}

module.exports = {
  getISTComponents,
  getISTDate,
  getISTDateStr,
  getISTTimeStr,
  getISTTime12h,
  parseTimeToMinutes,
  compareMarketTimes
};
