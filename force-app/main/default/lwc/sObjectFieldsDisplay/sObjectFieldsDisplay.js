import { LightningElement, wire } from 'lwc';
import { fieldColumns } from "./util";
import getFieldInfo from "@salesforce/apex/SObjectifyController.getFieldInfo";
import { 
    publish,
    subscribe,
    unsubscribe,
    APPLICATION_SCOPE, 
    MessageContext 
} from "lightning/messageService";
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';
import selectedFieldId from "@salesforce/messageChannel/sObjectifyFieldReference__c";
import sendCustomFields from "@salesforce/messageChannel/sObjectifyGetCurrentCustomFields__c";
import askForCurrentFields from "@salesforce/messageChannel/sObjectifyAskForCurrentFields__c";

export default class SObjectFieldsDisplay extends LightningElement {
    
    fieldsData;
    sObjectIdOrName;
    sObjectChangedSubscription;
    askForCurrentFieldsSubscription;
    customFieldsCount = 0;
    standardFieldsCount = 0;
    processing = false;
    defaultSortDirection = "asc";
    sortDirection = "asc";
    sortedBy = 'label';

    @wire(MessageContext)
    messageContext;

    //Get Columns
    get columns() {
        return [...fieldColumns];
    }

    get totalFields() {
        return (Number(this.standardFieldsCount) + Number(this.customFieldsCount));
    }

    connectedCallback(){
        if (!this.sObjectChangedSubscription) {
            this.sObjectChangedSubscription = subscribe(
                this.messageContext,
                sObjectChanged,
                (message) => this.handleSObjectComboChange(message),
                { scope: APPLICATION_SCOPE }
            )
        }

        if (!this.askForCurrentFieldsSubscription) {
            this.askForCurrentFieldsSubscription = subscribe(
              this.messageContext,
              askForCurrentFields,
              (message) => this.handleAskForCurrentFieldsMessage(),
              { scope: APPLICATION_SCOPE }
            )
          }
    }

    async handleSObjectComboChange(message){
        //Start processing
        this.processing = true;
        //Set variables
        this.sObjectIdOrName = message.sObjectIdOrName;
        try {
            const result = await getFieldInfo({
              sObjectName: message.sObjectAPIName,
              sObjectId: message.sObjectIdOrName,
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
            this.fieldsData = receivedFields;
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

    handleAskForCurrentFieldsMessage(){
        let customFields = this.recordsData.filter( record => record.isCustom).map( rec => ( { fieldId: rec.fieldId, apiName: rec.apiName, label: rec.label  } ))
        publish(this.messageContext, sendCustomFields, { currentCustomFields: customFields });
    }

    handleRowAction(event){
        const payload = { selectedFieldAPIName: event.detail.row.apiName, selectedFieldLabel: event.detail.row.label, selectedFieldId: event.detail.row.fieldId, selectedSObjectId: this.sObjectIdOrName };
        publish(this.messageContext, selectedFieldId, payload);
    }

    disconnectedCallback(){
        unsubscribe(this.sObjectChangedSubscription);
        unsubscribe(this.askForCurrentFieldsSubscription);
        this.sObjectChangedSubscription = null;
        this.askForCurrentFieldsSubscription = null;
    }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.fieldsData];
    
        cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
        this.fieldsData = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
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