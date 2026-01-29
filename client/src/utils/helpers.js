export const formatCurrency = (amount) => {
  return `$${parseFloat(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const showMessage = (title, message, isError = false) => {
  // You can implement a toast notification or modal here
  if (isError) {
    console.error(`${title}: ${message}`);
  } else {
    console.log(`${title}: ${message}`);
  }
  alert(`${title}\n\n${message}`);
};
