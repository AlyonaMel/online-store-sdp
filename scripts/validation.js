"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
var form = document.querySelector('.contacts__form');
var telSelector = document.querySelector('.tel');
var inputMask = new Inputmask('+7 (999) 999-99-99');
inputMask.mask(telSelector);
var validation = new JustValidate('.contacts__form', {
  colorWrong: '#bb370e'
});
validation.addField('.name', [{
  rule: 'minLength',
  value: 2,
  errorMessage: 'Вы не ввели имя'
}, {
  rule: 'maxLength',
  value: 30,
  errorMessage: 'Вы ввели больше, чем положено'
}, {
  rule: 'required',
  value: true,
  errorMessage: 'Вы не ввели имя'
}]).addField('.mail', [{
  rule: 'required',
  value: true,
  errorMessage: 'Вы не ввели e-mail'
}, {
  rule: 'email',
  value: true,
  errorMessage: 'Введите корректный e-mail'
}]).addField('.tel', [{
  rule: 'required',
  value: true,
  errorMessage: 'Вы не ввели телефон'
}, {
  rule: 'function',
  validator: function validator() {
    var phone = telSelector.inputmask.unmaskedvalue();
    return phone.length === 10;
  },
  errorMessage: 'Введите корректный телефон'
}]).onSuccess(function (event) {
  var _console;
  console.log('Validation passes and form submitted', event);
  var formData = new FormData(event.target);
  (_console = console).log.apply(_console, _toConsumableArray(formData));
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        console.log('Отправлено');
      }
    }
  };
  xhr.open('POST', 'mail.php', true);
  xhr.send(formData);
  event.target.reset();
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsIm5hbWVzIjpbImZvcm0iLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ0ZWxTZWxlY3RvciIsImlucHV0TWFzayIsIklucHV0bWFzayIsIm1hc2siLCJ2YWxpZGF0aW9uIiwiSnVzdFZhbGlkYXRlIiwiY29sb3JXcm9uZyIsImFkZEZpZWxkIiwicnVsZSIsInZhbHVlIiwiZXJyb3JNZXNzYWdlIiwidmFsaWRhdG9yIiwicGhvbmUiLCJpbnB1dG1hc2siLCJ1bm1hc2tlZHZhbHVlIiwibGVuZ3RoIiwib25TdWNjZXNzIiwiZXZlbnQiLCJfY29uc29sZSIsImNvbnNvbGUiLCJsb2ciLCJmb3JtRGF0YSIsIkZvcm1EYXRhIiwidGFyZ2V0IiwiYXBwbHkiLCJfdG9Db25zdW1hYmxlQXJyYXkiLCJ4aHIiLCJYTUxIdHRwUmVxdWVzdCIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlYWR5U3RhdGUiLCJzdGF0dXMiLCJvcGVuIiwic2VuZCIsInJlc2V0Il0sInNvdXJjZXMiOlsidmFsaWRhdGlvbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBmb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNvbnRhY3RzX19mb3JtJyk7XG5jb25zdCB0ZWxTZWxlY3RvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy50ZWwnKTtcbmNvbnN0IGlucHV0TWFzayA9IG5ldyBJbnB1dG1hc2soJys3ICg5OTkpIDk5OS05OS05OScpO1xuaW5wdXRNYXNrLm1hc2sodGVsU2VsZWN0b3IpO1xuXG5jb25zdCB2YWxpZGF0aW9uID0gbmV3IEp1c3RWYWxpZGF0ZSgnLmNvbnRhY3RzX19mb3JtJywge1xuICBjb2xvcldyb25nOiAnI2JiMzcwZSdcbn0pO1xuXG52YWxpZGF0aW9uXG4gIC5hZGRGaWVsZCgnLm5hbWUnLCBbXG4gICAge1xuICAgICAgcnVsZTogJ21pbkxlbmd0aCcsXG4gICAgICB2YWx1ZTogMixcbiAgICAgIGVycm9yTWVzc2FnZTogJ9CS0Ysg0L3QtSDQstCy0LXQu9C4INC40LzRjydcbiAgICB9LFxuICAgIHtcbiAgICAgIHJ1bGU6ICdtYXhMZW5ndGgnLFxuICAgICAgdmFsdWU6IDMwLFxuICAgICAgZXJyb3JNZXNzYWdlOiAn0JLRiyDQstCy0LXQu9C4INCx0L7Qu9GM0YjQtSwg0YfQtdC8INC/0L7Qu9C+0LbQtdC90L4nXG4gICAgfSxcbiAgICB7XG4gICAgICBydWxlOiAncmVxdWlyZWQnLFxuICAgICAgdmFsdWU6IHRydWUsXG4gICAgICBlcnJvck1lc3NhZ2U6ICfQktGLINC90LUg0LLQstC10LvQuCDQuNC80Y8nLFxuICAgIH1cbiAgXSlcbiAgLmFkZEZpZWxkKCcubWFpbCcsIFtcbiAgICB7XG4gICAgICBydWxlOiAncmVxdWlyZWQnLFxuICAgICAgdmFsdWU6IHRydWUsXG4gICAgICBlcnJvck1lc3NhZ2U6ICfQktGLINC90LUg0LLQstC10LvQuCBlLW1haWwnLFxuICAgIH0sXG4gICAge1xuICAgICAgcnVsZTogJ2VtYWlsJyxcbiAgICAgIHZhbHVlOiB0cnVlLFxuICAgICAgZXJyb3JNZXNzYWdlOiAn0JLQstC10LTQuNGC0LUg0LrQvtGA0YDQtdC60YLQvdGL0LkgZS1tYWlsJyxcbiAgICB9LFxuICBdKVxuICAuYWRkRmllbGQoJy50ZWwnLCBbXG4gICAge1xuICAgICAgcnVsZTogJ3JlcXVpcmVkJyxcbiAgICAgIHZhbHVlOiB0cnVlLFxuICAgICAgZXJyb3JNZXNzYWdlOiAn0JLRiyDQvdC1INCy0LLQtdC70Lgg0YLQtdC70LXRhNC+0L0nLFxuICAgIH0sXG4gICAge1xuICAgICAgcnVsZTogJ2Z1bmN0aW9uJyxcbiAgICAgIHZhbGlkYXRvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IHBob25lID0gdGVsU2VsZWN0b3IuaW5wdXRtYXNrLnVubWFza2VkdmFsdWUoKTtcbiAgICAgICAgcmV0dXJuIHBob25lLmxlbmd0aCA9PT0gMTA7XG4gICAgICB9LFxuICAgICAgZXJyb3JNZXNzYWdlOiAn0JLQstC10LTQuNGC0LUg0LrQvtGA0YDQtdC60YLQvdGL0Lkg0YLQtdC70LXRhNC+0L0nLFxuICAgIH0sXG4gIF0pLm9uU3VjY2VzcygoZXZlbnQpID0+IHtcbiAgICBjb25zb2xlLmxvZygnVmFsaWRhdGlvbiBwYXNzZXMgYW5kIGZvcm0gc3VibWl0dGVkJywgZXZlbnQpO1xuXG4gICAgbGV0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGV2ZW50LnRhcmdldCk7XG5cbiAgICBjb25zb2xlLmxvZyguLi5mb3JtRGF0YSk7XG5cbiAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygn0J7RgtC/0YDQsNCy0LvQtdC90L4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHhoci5vcGVuKCdQT1NUJywgJ21haWwucGhwJywgdHJ1ZSk7XG4gICAgeGhyLnNlbmQoZm9ybURhdGEpO1xuXG4gICAgZXZlbnQudGFyZ2V0LnJlc2V0KCk7XG4gIH0pO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLElBQU1BLElBQUksR0FBR0MsUUFBUSxDQUFDQyxhQUFhLENBQUMsaUJBQWlCLENBQUM7QUFDdEQsSUFBTUMsV0FBVyxHQUFHRixRQUFRLENBQUNDLGFBQWEsQ0FBQyxNQUFNLENBQUM7QUFDbEQsSUFBTUUsU0FBUyxHQUFHLElBQUlDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQztBQUNyREQsU0FBUyxDQUFDRSxJQUFJLENBQUNILFdBQVcsQ0FBQztBQUUzQixJQUFNSSxVQUFVLEdBQUcsSUFBSUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFO0VBQ3JEQyxVQUFVLEVBQUU7QUFDZCxDQUFDLENBQUM7QUFFRkYsVUFBVSxDQUNQRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQ2pCO0VBQ0VDLElBQUksRUFBRSxXQUFXO0VBQ2pCQyxLQUFLLEVBQUUsQ0FBQztFQUNSQyxZQUFZLEVBQUU7QUFDaEIsQ0FBQyxFQUNEO0VBQ0VGLElBQUksRUFBRSxXQUFXO0VBQ2pCQyxLQUFLLEVBQUUsRUFBRTtFQUNUQyxZQUFZLEVBQUU7QUFDaEIsQ0FBQyxFQUNEO0VBQ0VGLElBQUksRUFBRSxVQUFVO0VBQ2hCQyxLQUFLLEVBQUUsSUFBSTtFQUNYQyxZQUFZLEVBQUU7QUFDaEIsQ0FBQyxDQUNGLENBQUMsQ0FDREgsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUNqQjtFQUNFQyxJQUFJLEVBQUUsVUFBVTtFQUNoQkMsS0FBSyxFQUFFLElBQUk7RUFDWEMsWUFBWSxFQUFFO0FBQ2hCLENBQUMsRUFDRDtFQUNFRixJQUFJLEVBQUUsT0FBTztFQUNiQyxLQUFLLEVBQUUsSUFBSTtFQUNYQyxZQUFZLEVBQUU7QUFDaEIsQ0FBQyxDQUNGLENBQUMsQ0FDREgsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUNoQjtFQUNFQyxJQUFJLEVBQUUsVUFBVTtFQUNoQkMsS0FBSyxFQUFFLElBQUk7RUFDWEMsWUFBWSxFQUFFO0FBQ2hCLENBQUMsRUFDRDtFQUNFRixJQUFJLEVBQUUsVUFBVTtFQUNoQkcsU0FBUyxFQUFFLFNBQUFBLFVBQUEsRUFBVztJQUNwQixJQUFNQyxLQUFLLEdBQUdaLFdBQVcsQ0FBQ2EsU0FBUyxDQUFDQyxhQUFhLEVBQUU7SUFDbkQsT0FBT0YsS0FBSyxDQUFDRyxNQUFNLEtBQUssRUFBRTtFQUM1QixDQUFDO0VBQ0RMLFlBQVksRUFBRTtBQUNoQixDQUFDLENBQ0YsQ0FBQyxDQUFDTSxTQUFTLENBQUMsVUFBQ0MsS0FBSyxFQUFLO0VBQUEsSUFBQUMsUUFBQTtFQUN0QkMsT0FBTyxDQUFDQyxHQUFHLENBQUMsc0NBQXNDLEVBQUVILEtBQUssQ0FBQztFQUUxRCxJQUFJSSxRQUFRLEdBQUcsSUFBSUMsUUFBUSxDQUFDTCxLQUFLLENBQUNNLE1BQU0sQ0FBQztFQUV6QyxDQUFBTCxRQUFBLEdBQUFDLE9BQU8sRUFBQ0MsR0FBRyxDQUFBSSxLQUFBLENBQUFOLFFBQUEsRUFBQU8sa0JBQUEsQ0FBSUosUUFBUSxFQUFDO0VBRXhCLElBQUlLLEdBQUcsR0FBRyxJQUFJQyxjQUFjLEVBQUU7RUFFOUJELEdBQUcsQ0FBQ0Usa0JBQWtCLEdBQUcsWUFBWTtJQUNuQyxJQUFJRixHQUFHLENBQUNHLFVBQVUsS0FBSyxDQUFDLEVBQUU7TUFDeEIsSUFBSUgsR0FBRyxDQUFDSSxNQUFNLEtBQUssR0FBRyxFQUFFO1FBQ3RCWCxPQUFPLENBQUNDLEdBQUcsQ0FBQyxZQUFZLENBQUM7TUFDM0I7SUFDRjtFQUNGLENBQUM7RUFFRE0sR0FBRyxDQUFDSyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUM7RUFDbENMLEdBQUcsQ0FBQ00sSUFBSSxDQUFDWCxRQUFRLENBQUM7RUFFbEJKLEtBQUssQ0FBQ00sTUFBTSxDQUFDVSxLQUFLLEVBQUU7QUFDdEIsQ0FBQyxDQUFDIn0=
