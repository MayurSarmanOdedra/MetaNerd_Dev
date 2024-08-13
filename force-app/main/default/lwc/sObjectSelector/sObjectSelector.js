import { LightningElement, api, wire } from "lwc";
import { publish, MessageContext } from 'lightning/messageService';
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';


export default class SObjectSelector extends LightningElement {

  @api options;
  isSObjectSelected = false;


  @wire(MessageContext)
  messageContext;

  //Get SObject Selection Label
  get sObjectSelectionLabel() {
    return this.isSObjectSelected ? "Selected SObject" : "Select SObject";
  }

  handleSObjectComboChange(event){
    if(!this.isSObjectSelected)
      this.isSObjectSelected = true;

      let payload = { 
        sObjectAPIName: event.detail.value,
        sObjectLabel: event.target.options.find(opt => opt.value === event.detail.value).label.split(' - ')[0]
      };

      publish(this.messageContext, sObjectChanged, payload);
  }
}