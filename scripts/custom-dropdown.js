"use strict";

/** Выпадающие списки фильтров */
var filters = document.querySelectorAll('.filters__item');
filters.forEach(function (filter) {
  filter.addEventListener('click', function (e) {
    {
      e.stopImmediatePropagation();
      filters.forEach(function (hideFilter) {
        if (hideFilter !== e.currentTarget) {
          var hideContent = hideFilter.querySelector('.filter__content');
          hideFilter.classList.toggle('filters__item--active', false);
          hideContent.classList.toggle('filter__content--active', false);
        }
      });
      var content = e.currentTarget.querySelector('.filter__content');
      if (e.currentTarget === filter && e.target !== content && e.currentTarget.classList.contains('filters__item--active')) {
        e.currentTarget.classList.toggle('filters__item--active', false);
        content.classList.toggle('filter__content--active', false);
      } else {
        e.currentTarget.classList.toggle('filters__item--active', true);
        content.classList.toggle('filter__content--active', true);
      }
    }
  });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLWRyb3Bkb3duLmpzIiwibmFtZXMiOlsiZmlsdGVycyIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvckFsbCIsImZvckVhY2giLCJmaWx0ZXIiLCJhZGRFdmVudExpc3RlbmVyIiwiZSIsInN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiIsImhpZGVGaWx0ZXIiLCJjdXJyZW50VGFyZ2V0IiwiaGlkZUNvbnRlbnQiLCJxdWVyeVNlbGVjdG9yIiwiY2xhc3NMaXN0IiwidG9nZ2xlIiwiY29udGVudCIsInRhcmdldCIsImNvbnRhaW5zIl0sInNvdXJjZXMiOlsiY3VzdG9tLWRyb3Bkb3duLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKiDQktGL0L/QsNC00LDRjtGJ0LjQtSDRgdC/0LjRgdC60Lgg0YTQuNC70YzRgtGA0L7QsiAqL1xyXG5jb25zdCBmaWx0ZXJzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmZpbHRlcnNfX2l0ZW0nKTtcclxuXHJcbmZpbHRlcnMuZm9yRWFjaCgoZmlsdGVyKSA9PiB7XHJcblxyXG5cclxuICBmaWx0ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAge1xyXG4gICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICBmaWx0ZXJzLmZvckVhY2goKGhpZGVGaWx0ZXIpID0+IHtcclxuICAgICAgICBpZihoaWRlRmlsdGVyICE9PSBlLmN1cnJlbnRUYXJnZXQpIHtcclxuICAgICAgICAgIGNvbnN0IGhpZGVDb250ZW50ID0gaGlkZUZpbHRlci5xdWVyeVNlbGVjdG9yKCcuZmlsdGVyX19jb250ZW50Jyk7XHJcbiAgICAgICAgICBoaWRlRmlsdGVyLmNsYXNzTGlzdC50b2dnbGUoJ2ZpbHRlcnNfX2l0ZW0tLWFjdGl2ZScsIGZhbHNlKTtcclxuICAgICAgICAgIGhpZGVDb250ZW50LmNsYXNzTGlzdC50b2dnbGUoJ2ZpbHRlcl9fY29udGVudC0tYWN0aXZlJywgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBlLmN1cnJlbnRUYXJnZXQucXVlcnlTZWxlY3RvcignLmZpbHRlcl9fY29udGVudCcpO1xyXG5cclxuXHJcbiAgICAgIGlmKGUuY3VycmVudFRhcmdldCA9PT0gZmlsdGVyICYmIGUudGFyZ2V0ICE9PSBjb250ZW50ICYmIGUuY3VycmVudFRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZpbHRlcnNfX2l0ZW0tLWFjdGl2ZScpKSB7XHJcbiAgICAgICAgZS5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoJ2ZpbHRlcnNfX2l0ZW0tLWFjdGl2ZScsIGZhbHNlKTtcclxuICAgICAgICBjb250ZW50LmNsYXNzTGlzdC50b2dnbGUoJ2ZpbHRlcl9fY29udGVudC0tYWN0aXZlJywgZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGUuY3VycmVudFRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKCdmaWx0ZXJzX19pdGVtLS1hY3RpdmUnLCB0cnVlKTtcclxuICAgICAgICBjb250ZW50LmNsYXNzTGlzdC50b2dnbGUoJ2ZpbHRlcl9fY29udGVudC0tYWN0aXZlJywgdHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufSk7XHJcbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLElBQU1BLE9BQU8sR0FBR0MsUUFBUSxDQUFDQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQztBQUUzREYsT0FBTyxDQUFDRyxPQUFPLENBQUMsVUFBQ0MsTUFBTSxFQUFLO0VBRzFCQSxNQUFNLENBQUNDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFDQyxDQUFDLEVBQUs7SUFDdEM7TUFDRUEsQ0FBQyxDQUFDQyx3QkFBd0IsRUFBRTtNQUM1QlAsT0FBTyxDQUFDRyxPQUFPLENBQUMsVUFBQ0ssVUFBVSxFQUFLO1FBQzlCLElBQUdBLFVBQVUsS0FBS0YsQ0FBQyxDQUFDRyxhQUFhLEVBQUU7VUFDakMsSUFBTUMsV0FBVyxHQUFHRixVQUFVLENBQUNHLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztVQUNoRUgsVUFBVSxDQUFDSSxTQUFTLENBQUNDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUM7VUFDM0RILFdBQVcsQ0FBQ0UsU0FBUyxDQUFDQyxNQUFNLENBQUMseUJBQXlCLEVBQUUsS0FBSyxDQUFDO1FBQ2hFO01BQ0YsQ0FBQyxDQUFDO01BQ0YsSUFBTUMsT0FBTyxHQUFHUixDQUFDLENBQUNHLGFBQWEsQ0FBQ0UsYUFBYSxDQUFDLGtCQUFrQixDQUFDO01BR2pFLElBQUdMLENBQUMsQ0FBQ0csYUFBYSxLQUFLTCxNQUFNLElBQUlFLENBQUMsQ0FBQ1MsTUFBTSxLQUFLRCxPQUFPLElBQUlSLENBQUMsQ0FBQ0csYUFBYSxDQUFDRyxTQUFTLENBQUNJLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO1FBQ3BIVixDQUFDLENBQUNHLGFBQWEsQ0FBQ0csU0FBUyxDQUFDQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDO1FBQ2hFQyxPQUFPLENBQUNGLFNBQVMsQ0FBQ0MsTUFBTSxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQztNQUM1RCxDQUFDLE1BQ0k7UUFDSFAsQ0FBQyxDQUFDRyxhQUFhLENBQUNHLFNBQVMsQ0FBQ0MsTUFBTSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQztRQUMvREMsT0FBTyxDQUFDRixTQUFTLENBQUNDLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUM7TUFDM0Q7SUFDRjtFQUNGLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyJ9
