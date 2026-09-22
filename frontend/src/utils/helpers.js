export function truncateCid(cid, start = 8, end = 6) {
  if (!cid) return '';
  if (cid.length <= start + end) return cid;
  return `${cid.slice(0, start)}...${cid.slice(-end)}`;
}

export function formatTimestamp(isoString) {
  if (!isoString) return 'Just now';
  const now = new Date();
  const past = new Date(isoString);
  const diffInSec = Math.floor((now - past) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w`;
}

export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
  }
  return false;
}
