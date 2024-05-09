import { LightningElement, api } from "lwc";


export default class SObjectSelector extends LightningElement {

  @api options;
  isSObjectSelected = false;

  //Get SObject Selection Label
  get sObjectSelectionLabel() {
    return this.isSObjectSelected ? "Selected SObject" : "Select SObject";
  }

  handleSObjectComboChange(event){
    if(!this.isSObjectSelected)
      this.isSObjectSelected = true;
    
    this.dispatchEvent(new CustomEvent('sobjectchanged', {
      detail: event.detail.value
    }));
  }
}
