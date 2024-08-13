import { LightningElement, wire } from "lwc";
import {
  publish,
  subscribe,
  unsubscribe,
  APPLICATION_SCOPE,
  MessageContext,
} from "lightning/messageService";
import getUnusedFields from "@salesforce/apex/SObjectifyController.getUnusedFields";
import getCurrentCustomFields from "@salesforce/messageChannel/sObjectifyGetCurrentCustomFields__c";
import askForCustomFields from "@salesforce/messageChannel/sObjectifyAskForCurrentFields__c";
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';

const columns = [
  {
    label: "Label",
    fieldName: "label",
    wrapText: true,
  },
  {
    label: "API Name",
    fieldName: "apiName",
  },
  {
    type: "button",
    typeAttributes: {
      label: "Where is this used?",
      name: "view_component",
      disabled: false,
      variant: "neutral",
    },
    initialWidth: 170,
  },
  {
    type: "button",
    typeAttributes: {
      label: 'Delete',
      alternativeText: "Delete",
      name: "delete_component",
      disabled: false,
      variant: "destructive",
    },
    initialWidth: 90,
  },
];

export default class SObjectUnusedFields extends LightningElement {
  iconName = 'utility:preview';
  iconAltText = 'Connected';
  showComponentDescription= true;
  isShowVisibile = true;
  columns = columns;
  data;

  getCurrentFieldsSubscription = null;
  sObjectChangedSubscription = null;

  @wire(MessageContext)
  messageContext;

  connectedCallback() {
    this.subscribeToMessageChannel();
  }

  handleShowUnusedFieldsClick() {
    publish(this.messageContext, askForCustomFields, null);
  }

  subscribeToMessageChannel() {
    if (!this.getCurrentFieldsSubscription) {
      this.getCurrentFieldsSubscription = subscribe(
        this.messageContext,
        getCurrentCustomFields,
        (message) => this.handleFieldSelectMessage(message),
        { scope: APPLICATION_SCOPE }
      );
    }

    if(!this.sObjectChangedSubscription){
      this.sObjectChangedSubscription = subscribe(
         this.messageContext,
         sObjectChanged,
         (message) => this.handleSObjectChangedMessage(),
         { scope: APPLICATION_SCOPE }
      )
    }
  }
  
  handleFieldSelectMessage(message) {
    console.log("Message received..");
    console.table(message.currentCustomFields);
    
    let fieldIds = message.currentCustomFields.map((field) => field.fieldId);
    
    getUnusedFields({
      customFieldIds: fieldIds,
    })
    .then((result) => {
      if(result.length === 0){
        this.iconName = 'utility:clear';
        this.iconAltText = 'Not found';
        this.showComponentDescription = false;
        this.isShowVisibile = false;
      }else{
        this.data = message.currentCustomFields.filter( field => result.includes(field.fieldId));
      }
    })
    .catch((error) => console.error(error));
  }

  handleSObjectChangedMessage() {
    this.iconName = 'utility:preview';
    this.iconAltText = 'Connected';
    this.showComponentDescription = true;
    this.isShowVisibile = true;
    this.data = undefined;   
  }
  
  unsubscribeToMessageChannel() {
    unsubscribe(this.getCurrentFieldsSubscription);
    unsubscribe(this.sObjectChangedSubscription);

    this.getCurrentFieldsSubscription = null;
    this.sObjectChangedSubscription = null;
  }
  
  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }
}