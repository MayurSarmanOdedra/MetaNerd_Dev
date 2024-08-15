import { LightningElement, wire } from "lwc";
import getSObjectInfo from "@salesforce/apex/SObjectifyController.getSObjectInfo";
import getFieldInfo from "@salesforce/apex/SObjectifyController.getFieldInfo";
import getCustomSObjectId from "@salesforce/apex/SObjectifyController.getCustomSObjectId";
import { 
  publish, 
  subscribe,
  unsubscribe,
  APPLICATION_SCOPE, 
  MessageContext 
} from "lightning/messageService";
import sendCustomFields from "@salesforce/messageChannel/sObjectifyGetCurrentCustomFields__c";
import askForCurrentFields from "@salesforce/messageChannel/sObjectifyAskForCurrentFields__c";
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';

export default class SObjectify extends LightningElement {
  options = undefined;
  selectedSObject;
  selectSObjectIdOrName;
  selectedSObjectLabel;
  sortedBy;
  recordsData = undefined;
  customFieldsCount = 0;
  standardFieldsCount = 0;
  processing = true;
  askForCurrentFieldsSubscription = null;
  sObjectChangedSubscription = null;

  @wire(MessageContext)
  messageContext;

  @wire(getSObjectInfo)
  orgSObjects({ error, data }) {
    if (data) {
      let dataAsString = JSON.stringify(this.sortData([...data]));
      this.options = dataAsString;
      this.processing = false;
    } else {
      console.log("No Sobjects returned with error");
    }
  }

  connectedCallback(){
    this.subscribeToMessageChannel();
  }

  subscribeToMessageChannel(){
    if (!this.askForCurrentFieldsSubscription) {
      this.askForCurrentFieldsSubscription = subscribe(
        this.messageContext,
        askForCurrentFields,
        (message) => this.handleAskForCurrentFieldsMessage(),
        { scope: APPLICATION_SCOPE }
      )
    }

    if(!this.sObjectChangedSubscription){
      this.sObjectChangedSubscription = subscribe(
        this.messageContext,
        sObjectChanged,
        (message) => this.handleSObjectComboChange(message),
        { scope: APPLICATION_SCOPE }
      )
    }
  }

  handleAskForCurrentFieldsMessage(){
    let customFields = this.recordsData.filter( record => record.isCustom).map( rec => ( { fieldId: rec.fieldId, apiName: rec.apiName, label: rec.label  } ))
    publish(this.messageContext, sendCustomFields, { currentCustomFields: customFields });
  }

  async handleSObjectComboChange(message){
    this.selectedSObject = message.sObjectAPIName;
    this.selectedSObjectLabel = message.sObjectLabel;

    //Start processing
    this.processing = true;

    try {
      this.selectSObjectIdOrName = await getCustomSObjectId({
        sObjectName: this.selectedSObject,
      });
    } catch (error) {
      console.log(
        `Error occured when retrieving SObject Id. ::: ${JSON.stringify(
          error
        )}`
      );
    }

    try {
      const result = await getFieldInfo({
        sObjectName: this.selectedSObject,
        sObjectId: this.selectSObjectIdOrName,
      });
      const receivedFields = [...result]
        .sort(this.sortBy("label", 1))
        .sort(this.sortBy('isCustom', -1))
        .map((item) => ({ ...item, isStandard: !item.isCustom }));
      this.customFieldsCount = receivedFields.reduce(
        (accumulator, field) => accumulator + (field.isCustom ? 1 : 0),
        0
      );
      this.standardFieldsCount =
        receivedFields.length - this.customFieldsCount;
      this.recordsData = receivedFields;
    } catch (error) {
      console.log(
        `Error occured when retrieving SObject fields. ::: ${JSON.stringify(
          error
        )}`
      );
    }
    //stop processing
    this.processing = false;
  }

  disconnectedCallback(){
    this.unsubscribeFromMessageChannel();
  }

  unsubscribeFromMessageChannel(){
    unsubscribe(this.askForCurrentFieldsSubscription);
    unsubscribe(this.sObjectChangedSubscription);
    
    this.askForCurrentFieldsSubscription = null;
    this.sObjectChangedSubscription = null;
  }

  sortData(dataToSort) {
    return dataToSort.sort((a, b) => {
      return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
    });
  }

  sortBy(field, reverse, primer) {
    const key = primer
      ? function (x) {
          return primer(x[field]);
        }
      : function (x) {
          return x[field];
        };

    return function (a, b) {
      a = key(a);
      b = key(b);
      return reverse * ((a > b) - (b > a));
    };
  }

}