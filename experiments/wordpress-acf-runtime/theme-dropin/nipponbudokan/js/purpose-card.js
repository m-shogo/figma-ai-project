(function () {
  var fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (fineHover.matches) {
    return;
  }

  document.addEventListener('click', function (event) {
    var card = event.target.closest('.purposeCard');
    var opened = document.querySelectorAll('.purposeCard.is-open');

    if (!card) {
      opened.forEach(function (item) {
        item.classList.remove('is-open');
      });
      return;
    }

    if (card.classList.contains('is-open')) {
      return;
    }

    opened.forEach(function (item) {
      item.classList.remove('is-open');
    });
    card.classList.add('is-open');
    event.preventDefault();
  });
})();
