import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { columnsByMetadataInfoMap } from "./columns";
import getSObjectMetadataInfo from "@salesforce/apex/SObjectifyController.getSObjectMetadataInfo";
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
import infoChanged from "@salesforce/messageChannel/sObjectifyInfoChanged__c";

export default class SObjectFieldsDisplay extends LightningElement {
    
    sObjectIdOrName;
    sObjectName;
    recordsData;
    currentInfoLabel;
    sObjectChangedSubscription;
    askForCurrentFieldsSubscription;
    infoChangedSubscription;
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
      return columnsByMetadataInfoMap.get(this.currentInfoLabel);
    }

    get totalFields() {
        return this.currentInfoLabel === 'Fields' ? (Number(this.standardFieldsCount) + Number(this.customFieldsCount)) : null;
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

        if(!this.infoChangedSubscription){
            this.infoChangedSubscription = subscribe(
                this.messageContext,
                infoChanged,
                (message) => this.handleInfoChangedMessage(message),
                { scope: APPLICATION_SCOPE }
            )
        }
    }

    async handleInfoChangedMessage(message){
      const fixedInfos = ['Fields', 'Page Layouts', 'Record Types'];
      this.currentInfoLabel = message.infoLabel;

      if(!fixedInfos.includes(this.currentInfoLabel)){
        this.recordsData = undefined;
        const event = new ShowToastEvent({
          title: 'Info',
          message:
              `We are currently working to retrieve ${message.infoLabel} information and will provide it soon. Thank you for your patience!`,
          mode: 'sticky'
        });
        this.dispatchEvent(event);
        return;
      }

      //Start processing
      this.processing = true;
      try {
        let result = await getSObjectMetadataInfo({
          sObjectName: this.sObjectName,
          infoType: this.currentInfoLabel
        });
        result = [...result];
        result.sort(this.sortBy("label", 1))
        //for 'Fields' info
        if(this.currentInfoLabel === 'Fields'){
          result.sort(this.sortBy('isCustom', -1));
          result = result.map((item) => ({ ...item, isStandard: !item.isCustom }));
          this.customFieldsCount = result.reduce(
            (accumulator, field) => accumulator + (field.isCustom ? 1 : 0),
            0
          );
          this.standardFieldsCount = result.length - this.customFieldsCount;
        }
        this.recordsData = result;
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

    handleSObjectComboChange(message){
        //Set variables
        this.sObjectIdOrName = message.sObjectIdOrName;
        this.sObjectName = message.sObjectAPIName;
        this.recordsData = undefined;
    }

    //TODO: This is not dynamic as not all records will have 'isCustom' field
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
        unsubscribe(this.infoChangedSubscription);
        this.sObjectChangedSubscription = null;
        this.askForCurrentFieldsSubscription = null;
        this.infoChangedSubscription = null;
    }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.recordsData];
    
        cloneData.sort(this.sortBy(sortedBy, sortDirection === "asc" ? 1 : -1));
        this.recordsData = cloneData;
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