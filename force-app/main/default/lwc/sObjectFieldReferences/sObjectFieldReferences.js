import { wire } from "lwc";
import {
  subscribe,
  unsubscribe,
  APPLICATION_SCOPE,
  MessageContext,
} from "lightning/messageService";
import LightningModal from 'lightning/modal';
import getFieldReferences from "@salesforce/apex/SObjectifyController.getFieldReferences";
import selectedFieldId from "@salesforce/messageChannel/sObjectifyFieldReference__c";

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

export default class SObjectFieldReferences extends LightningModal {
  fieldId;
  fieldReferences;
  columns = columns;
  unUsedField = false;
  selectedFieldLabel;
  selectedFieldAPIName;
  selectedSObjectId;

  selectedFieldIdSubscription;

  @wire(MessageContext)
  messageContext;

  get fieldLabel(){
    return `${this.selectedFieldLabel} (${this.selectedFieldAPIName})`;
  }

  connectedCallback() {
    if (!this.selectedFieldIdSubscription) {
      this.selectedFieldIdSubscription = subscribe(
        this.messageContext,
        selectedFieldId,
        (message) => this.handleFieldSelectMessage(message),
        { scope: APPLICATION_SCOPE }
      );
    }
  }

  // Handler for message received by component
  async handleFieldSelectMessage(message) {
    this.selectedFieldLabel = message.selectedFieldLabel;
    this.selectedFieldAPIName = message.selectedFieldAPIName;
    this.selectedSObjectId = message.selectedSObjectId;
    
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
    window.open(`${window.location.origin}/lightning/setup/ObjectManager/${this.selectedSObjectId}/FieldsAndRelationships/${this.fieldId.slice(0,this.fieldId.length - 3)}/fieldDependencies`);
  }

  disconnectedCallback() {
    unsubscribe(this.selectedFieldIdSubscription);
    this.selectedFieldIdSubscription = null;
  }
}