const NOTIFICATION_COLORS = {
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6"
};

export function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 16px",
    borderRadius: "8px",
    color: "white",
    fontWeight: "500",
    zIndex: "1000",
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
    maxWidth: "300px",
    wordWrap: "break-word"
  });

  notification.style.backgroundColor = NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.info;

  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
