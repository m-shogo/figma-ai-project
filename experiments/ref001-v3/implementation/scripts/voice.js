(() => {
  const root = document.querySelector('[data-section="student-voice"]');
  if (!root) return;
  const items = [...root.querySelectorAll('.v3-voice-item')];
  const sync = (item) => {
    const open = item.querySelector('.v3-voice-details')?.open === true;
    item.classList.toggle('v3-voice-item--open', open);
    item.classList.toggle('v3-voice-item--collapsed', !open);
  };
  items.forEach((item) => {
    const details = item.querySelector('.v3-voice-details');
    if (!details) return;
    details.addEventListener('toggle', () => {
      if (details.open) {
        items.forEach((other) => {
          if (other === item) return;
          const otherDetails = other.querySelector('.v3-voice-details');
          if (otherDetails?.open) otherDetails.open = false;
        });
      }
      items.forEach(sync);
    });
    sync(item);
  });
})();
