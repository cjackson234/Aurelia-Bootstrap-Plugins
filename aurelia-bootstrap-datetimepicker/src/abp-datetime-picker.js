import {inject, bindable, bindingMode} from 'aurelia-framework';
import moment from 'moment';
import $ from 'jquery';
import 'eonasdan-bootstrap-datetimepicker';
import {pickerGlobalOptions} from './picker-global-options';

const _defaultPickerOptions = {
  allowInputToggle: true
};

@inject(Element)
export class AbpDatetimePickerCustomElement {
  @bindable({defaultBindingMode: bindingMode.twoWay}) element;
  @bindable({defaultBindingMode: bindingMode.twoWay}) model;
  @bindable({defaultBindingMode: bindingMode.twoWay}) value;

  // plugin own variables
  @bindable iconBase = pickerGlobalOptions.iconBase;
  @bindable timezone = pickerGlobalOptions.timezone;
  @bindable withDateIcon = pickerGlobalOptions.withDateIcon;

  // options (from the View)
  @bindable options;

  // events (from the View)
  @bindable onHide;
  @bindable onShow;
  @bindable onChange;
  @bindable onError;
  @bindable onUpdate;

  // variables
  _originalValue;
  _originalDateFormat;
  _originalDateObject;
  _events = {};
  _methods = {};

  constructor(elm) {
    this.elm = elm;
  }

  attached() {
    // reference to the DOM element
    this.domElm = $(this.elm).find('.date');

    // add base icons, unless user already added some
    let pickerOptions = this.options || {};
    if (!this.options.icons) {
      pickerOptions.icons = this.attachIconBase();
    }

    // attach/expose some options
    this.applyExposeEvents();
    this.exposeMethods();

    // finally create the datepicker with all options
    pickerOptions = Object.assign({}, _defaultPickerOptions, pickerOptions);
    this.domElm.datetimepicker(pickerOptions);

    this.domElm.on('dp.change', (e) => {
      let format = this.getOption('format');
      this.model = moment(e.date).toDate();
      this.value = moment(e.date).format(format);
    });

    // expose the element object to the outside
    // this will be useful for calling events/methods/options from the outside
    this.element = {
      events: this._events,
      options: pickerOptions,
      methods: this._methods
    };
  }

  attachIconBase() {
    let icons;

    if (this.iconBase === 'font-awesome') {
      icons = {
        time: 'fa fa-clock-o',
        date: 'fa fa-calendar',
        up: 'fa fa-arrow-up',
        down: 'fa fa-arrow-down',
        previous: 'fa fa-chevron-left',
        next: 'fa fa-chevron-right',
        today: 'fa fa-calendar-check-o',
        clear: 'fa fa-trash',
        close: 'fa fa-window-close'
      };
    } else {
      icons = {
        time: 'glyphicon glyphicon-time',
        date: 'glyphicon glyphicon-calendar',
        up: 'glyphicon glyphicon-chevron-up',
        down: 'glyphicon glyphicon-chevron-down',
        previous: 'glyphicon glyphicon-chevron-left',
        next: 'glyphicon glyphicon-chevron-right',
        today: 'glyphicon glyphicon-screenshot',
        clear: 'glyphicon glyphicon-trash',
        close: 'glyphicon glyphicon-remove'
      };
    }
    return icons;
  }

  /**
   * Keep original value(s) that could be passed by the user ViewModel.
   */
  bind() {
    this._originalValue = this.value || this.elm.getAttribute('value');
    this._originalDateObject = moment(this.model).toDate() || this.elm.getAttribute('model');
    let options = this.options || this.elm.getAttribute('options');
    let value = this._originalValue || this._originalDateObject;
    let format = this._originalDateFormat = options.hasOwnProperty('format') ? options.format : null;

    this.model = moment(value).toDate();
    this.value = moment(value).format(format);
  }

  /**
   * Apply/expose datetimepicker events
   * Each event has 2 ways of triggering an event (from the View as an attribute or from the ViewModel has a function call)
   */
  applyExposeEvents() {
    this.domElm.on('dp.hide', (e) => {
      if (typeof this.onHide === 'function') {
        this.onHide(e);
      }
      if (typeof this._events.onHide === 'function') {
        this._events.onHide(e);
      }
    });

    this.domElm.on('dp.show', (e) => {
      if (typeof this.onShow === 'function') {
        this.onShow(e);
      }
      if (typeof this._events.onShow === 'function') {
        this._events.onShow(e);
      }
    });

    this.domElm.on('dp.change', (e) => {
      if (typeof this.onChange === 'function') {
        this.onChange(e);
      }
      if (typeof this._events.onChange === 'function') {
        this._events.onChange(e);
      }
    });

    this.domElm.on('dp.error', (e) => {
      if (typeof this.onError === 'function') {
        this.onError(e);
      }
      if (typeof this._events.onError === 'function') {
        this._events.onError(e);
      }
    });

    this.domElm.on('dp.update', (e) => {
      if (typeof this.onUpdate === 'function') {
        this.onUpdate(e);
      }
      if (typeof this._events.onUpdate === 'function') {
        this._events.onUpdate(e);
      }
    });
  }

  /**
   * Construct a method by it's type and name
   * We do this to avoid typing multiple line of the same, on 100 functions that makes a big difference in number of code lines.
   */
  constructMethod(methodType, methodName) {
    switch (methodType) {
    case 'getterSetter':
      return (value) => {
        if (value) {
          return this.domElm.data('DateTimePicker')[methodName](value);
        }
        return this.domElm.data('DateTimePicker')[methodName]();
      };
    case 'caller':
    case 'getter':
    default:
      return (value) => { return this.domElm.data('DateTimePicker')[methodName](); };
    }
  }

  /**
   * Expose datetimepicker methods
   */
  exposeMethods() {
    // prepare a list of methods with their type so we can construct them later
    let methodList = [
      { name: 'allowInputToggle', type: 'getterSetter' },
      { name: 'calendarWeeks', type: 'getterSetter' },
      { name: 'clear', type: 'caller' },
      { name: 'collapse', type: 'getterSetter' },
      { name: 'date', type: 'getterSetter' },
      { name: 'daysOfWeekDisabled', type: 'getterSetter' },
      { name: 'dayViewHeaderFormat', type: 'getterSetter' },
      { name: 'defaultDate', type: 'getterSetter' },
      { name: 'destroy', type: 'caller' },
      { name: 'debug', type: 'caller' },
      { name: 'disable', type: 'caller' },
      { name: 'disabledDates', type: 'getterSetter' },
      { name: 'disabledHours', type: 'getterSetter' },
      { name: 'disabledTimeIntervals', type: 'getterSetter' },
      { name: 'enable', type: 'caller' },
      { name: 'enabledDates', type: 'getterSetter' },
      { name: 'enabledHours', type: 'getterSetter' },
      { name: 'extraFormats', type: 'getterSetter' },
      { name: 'focusOnShow', type: 'getterSetter' },
      { name: 'format', type: 'getterSetter' },
      { name: 'hide', type: 'caller' },
      { name: 'icons', type: 'getterSetter' },
      { name: 'ignoreReadonly', type: 'getterSetter' },
      { name: 'inline', type: 'getterSetter' },
      { name: 'keepInvalid', type: 'getterSetter' },
      { name: 'keyBinds', type: 'getterSetter' },
      { name: 'locale', type: 'getterSetter' },
      { name: 'maxDate', type: 'getterSetter' },
      { name: 'minDate', type: 'getterSetter' },
      { name: 'options', type: 'getterSetter' },
      { name: 'parseInputDate', type: 'getterSetter' },
      { name: 'show', type: 'caller' },
      { name: 'showClear', type: 'getterSetter' },
      { name: 'showClose', type: 'getterSetter' },
      { name: 'showTodayButton', type: 'getterSetter' },
      { name: 'sideBySide', type: 'getterSetter' },
      { name: 'stepping', type: 'getterSetter' },
      { name: 'toggle', type: 'caller' },
      { name: 'toolbarplacement', type: 'getterSetter' },
      { name: 'tooltips', type: 'getterSetter' },
      { name: 'useCurrent', type: 'getterSetter' },
      { name: 'useStrict', type: 'getterSetter' },
      { name: 'viewDate', type: 'getterSetter' },
      { name: 'viewMode', type: 'getterSetter' },
      { name: 'widgetPositioning', type: 'getterSetter' }
    ];

    // loop through all methods and construct them before exponsing them to the element object
    let methods = {};
    methodList.forEach((method) => {
      methods[method.name] = this.constructMethod(method.type, method.name);
    });

    this._methods = methods;
  }

  detached() {
    this.domElm.data('DateTimePicker').destroy();
  }

  getOption(optionName) {
    let domElm = $(this.elm).find('.input-group.date');
    if (domElm && typeof domElm.data === 'function' && domElm.data('DateTimePicker')) {
      let options = domElm.data('DateTimePicker').options();
      return options.hasOwnProperty(optionName) ? options[optionName] : null;
    }
    return null;
  }

  modelChanged(newValue, oldValue) {
    if (typeof newValue.getMonth !== 'function') {
      throw new Error('Datetimepicker, model.bind must be of type Date');
    }
    if (newValue !== oldValue) {
      let format = this.getOption('format') || this._originalDateFormat;
      this.value = moment(newValue).format(format);
    }
  }

  valueChanged(newValue, oldValue) {
    if (newValue !== oldValue) {
      this.model = moment(newValue).toDate();
    }
  }

  parseBool(value) {
    return (/^(true|1)$/i).test(value);
  }
}