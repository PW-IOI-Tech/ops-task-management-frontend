export const convertUTCToIST = (utcTime: string|undefined): string | undefined => {
  if (!utcTime) return '';
  
  // Create a date object with UTC time
  const [hours, minutes] = utcTime.split(':').map(Number);
  const utcDate = new Date();
  utcDate.setUTCHours(hours, minutes, 0, 0);
  
  // Convert to IST (UTC+5:30)
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
  
  return istDate.toTimeString().slice(0, 5); // Returns HH:MM format
};

export const convertISTToUTC = (istTime: string | undefined): string|undefined => {
  if (!istTime) return '';
  
  // Create a date object with IST time
  const [hours, minutes] = istTime.split(':').map(Number);
  const istDate = new Date();
  istDate.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC (subtract 5:30)
  const utcDate = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
  
  return utcDate.toTimeString().slice(0, 5); // Returns HH:MM format
};