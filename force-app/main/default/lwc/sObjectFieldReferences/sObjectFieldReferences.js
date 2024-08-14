import { LightningElement, wire } from "lwc";
import {
  subscribe,
  unsubscribe,
  APPLICATION_SCOPE,
  MessageContext,
} from "lightning/messageService";
import getFieldReferences from "@salesforce/apex/SObjectifyController.getFieldReferences";
import selectedFieldId from "@salesforce/messageChannel/sObjectifyFieldReference__c";
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';

const columns = [
  {
    label: "Component Name",
    fieldName: "componentName",
    wrapText: true,
  },
  {
    label: "Component Type",
    fieldName: "componentType",
  },
  {
    type: "button",
    typeAttributes: {
      label: "View",
      name: "view_component",
      disabled: true,
      variant: "brand",
    },
    initialWidth: 90,
  },
];

export default class SObjectFieldReferences extends LightningElement {
  fieldId;
  fieldReferences;
  columns = columns;
  unUsedField = false;
  whereIsThisUsedUrl;
  selectedFieldLabel;
  selectedFieldAPIName;

  selectedFieldIdSubscription = null;
  sObjectChangedSubscription = null;

  @wire(MessageContext)
  messageContext;

  get showWhereIsThisUsed() {
    return this.fieldReferences || this.unUsedField;
  }

  get fieldLabel(){
    return `${this.selectedFieldLabel} (${this.selectedFieldAPIName})`;
  }

  // Encapsulate logic for Lightning message service subscribe and unsubsubscribe
  subscribeToMessageChannel() {
    if (!this.selectedFieldIdSubscription) {
      this.selectedFieldIdSubscription = subscribe(
        this.messageContext,
        selectedFieldId,
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

  // Handler for message received by component
  async handleFieldSelectMessage(message) {
    this.selectedFieldLabel = message.selectedFieldLabel;
    this.selectedFieldAPIName = message.selectedFieldAPIName;
    let shortenedField = message.selectedFieldId.slice(
      0,
      message.selectedFieldId.length - 3
    );
    
    const urlPreffix = `${window.location.origin}/p/setup/field/CustomFieldDependencyUi/d?`;
    this.whereIsThisUsedUrl = urlPreffix.concat(
      [
        `id=${shortenedField}`,
        `type=${message.selectedSObjectId}`,
        `retURL=/${shortenedField}`,
        `setupid=CustomObjects`,
      ].join("&")
    );
    
    try {
      let result = await getFieldReferences({
        fieldId: message.selectedFieldId,
      });
      if (result.length > 0) this.fieldReferences = result;
      else {
        this.fieldReferences = undefined;
        this.unUsedField = true;
      }
      this.fieldId = message.selectedFieldId;
    } catch (error) {
      console.log(
        `Error occured when getting field references :: ${JSON.stringify(
          error
        )}`
      );
    }
  }

  handleWhereIsThisUsedClick(){
    window.open(this.whereIsThisUsedUrl);
  }

  handleSObjectChangedMessage(){
    this.fieldId = undefined;
    this.fieldReferences = undefined;
    this.unUsedField = false;
    this.whereIsThisUsedUrl = undefined;
  }
  
  unsubscribeToMessageChannel() {
    unsubscribe(this.selectedFieldIdSubscription);
    unsubscribe(this.sObjectChangedSubscription);

    this.selectedFieldIdSubscription = null;
    this.sObjectChangedSubscription = null;
  }

  // Standard lifecycle hooks used to subscribe and unsubsubscribe to the message channel
  connectedCallback() {
    this.subscribeToMessageChannel();
  }

  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }
}