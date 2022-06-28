export default class ErrorMessage {
  constructor(lang, value) {
    this.lang = lang;
    this.value = value;
  }

  getLang(){
    return this.lang;
  }

  setLang(lang){
    this.lang = lang;
  }

  getValue(){
    return this.value;
  }

  setValue(value){
    this.value = value;
  }
}
