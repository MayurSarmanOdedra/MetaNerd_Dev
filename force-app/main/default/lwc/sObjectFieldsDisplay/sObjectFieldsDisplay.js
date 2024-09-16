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
import infoChanged from "@salesforce/messageChannel/sObjectifyInfoChanged__c";
import getUnusedFields from "@salesforce/apex/SObjectifyController.getUnusedFields";

export default class SObjectFieldsDisplay extends LightningElement {
    //Common variables
    sObjectIdOrName;
    sObjectName;
    recordsData;
    currentInfoLabel;
    sObjectChangedSubscription;
    infoChangedSubscription;
    processing = false;
    defaultSortDirection = "asc";
    sortDirection = "asc";
    sortedBy = 'label';
    noRecordsFound = false;
    //Fields related variables
    customFieldsCount = 0;
    standardFieldsCount = 0;
    allFields;
    unUsedFields;
    showAllFields = true;
    unUsedFieldsInfoLabel = 'Fields.Unused';

    @wire(MessageContext)
    messageContext;

    //Get Columns
    get columns() {
      return columnsByMetadataInfoMap.get(this.currentInfoLabel);
    }

    get currentLabelIsFields(){
      return this.currentInfoLabel === 'Fields'
    }

    get totalFields() {
      return this.currentLabelIsFields ? (Number(this.standardFieldsCount) + Number(this.customFieldsCount)) : null;
    }

    get showFieldsActions(){
      return (this.currentLabelIsFields || this.currentInfoLabel === this.unUsedFieldsInfoLabel) && this.customFieldsCount > 0;
    }

    get showAllFieldsClicked(){
      return this.showAllFields;
    }

    get alreadyRetrievedUnusedFields(){
      return this.unUsedFields;
    }

    get showApiLimitationFooter(){
      return !this.showAllFields && this.unUsedFields;
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
      if(!this.infoChangedSubscription){
          this.infoChangedSubscription = subscribe(
              this.messageContext,
              infoChanged,
              (message) => this.handleInfoChangedMessage(message),
              { scope: APPLICATION_SCOPE }
          )
      }
    }

    async handleFieldsFilter(event){
      if (event.target.variant === 'brand') return;

      this.toggleShowAllFields();
      this.updateButtonVariants();

      this.startProcessing();

      if (this.showAllFieldsClicked) {
        this.setAllFieldsData();
      } else if (this.alreadyRetrievedUnusedFields) {
        this.setUnusedFieldsData();
      } else {
        await this.retrieveAndSetUnusedFields();
      }

      this.stopProcessing();
    }

    toggleShowAllFields() {
      this.showAllFields = !this.showAllFields;
    }
    
    updateButtonVariants() {
      const unusedFieldsVariant = this.showAllFields ? 'brand-outline' : 'brand';
      const allFieldsVariant = this.showAllFields ? 'brand' : 'brand-outline';
    
      this.refs.showUnusedFieldsButton.variant = unusedFieldsVariant;
      this.refs.showAllFieldsButton.variant = allFieldsVariant;
    }
    
    startProcessing() {
      this.processing = true;
    }
    
    stopProcessing() {
      this.processing = false;
    }

    setAllFieldsData(){
      this.recordsData = this.allFields;
      this.currentInfoLabel = 'Fields';
    }

    setUnusedFieldsData(){
      this.recordsData = this.unUsedFields;
      this.currentInfoLabel = this.unUsedFieldsInfoLabel;
    }

    async retrieveAndSetUnusedFields() {
      const customFieldIds = this.getCustomFieldIds();
      const result = await getUnusedFields({ customFieldIds });

      if (result.length > 0) {
        this.unUsedFields = this.filterUnusedFields(result);
        this.recordsData = [...this.unUsedFields];
        this.currentInfoLabel = 'Fields.Unused';
      }else{
        this.recordsData = undefined;
        this.noRecordsFound = true;
      }
    }

    getCustomFieldIds() {
      return this.recordsData
        .filter(record => record.isCustom)
        .map(record => record.fieldId);
    }
    
    filterUnusedFields(result) {
      return this.allFields.filter(record => result.includes(record.fieldId));
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
        if(this.currentLabelIsFields){
          result.sort(this.sortBy('isCustom', -1));
          result = result.map((item) => ({ ...item, isStandard: !item.isCustom }));
          this.customFieldsCount = result.reduce(
            (accumulator, field) => accumulator + (field.isCustom ? 1 : 0),
            0
          );
          this.standardFieldsCount = result.length - this.customFieldsCount;
          this.allFields = result;
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
        this.allFields = undefined;
        this.currentInfoLabel = undefined;
        this.unUsedFields = undefined;
        this.recordsData = undefined;
    }

    handleRowAction(event){
        const payload = { selectedFieldAPIName: event.detail.row.apiName, selectedFieldLabel: event.detail.row.label, selectedFieldId: event.detail.row.fieldId, selectedSObjectId: this.sObjectIdOrName };
        publish(this.messageContext, selectedFieldId, payload);
    }

    disconnectedCallback(){
        unsubscribe(this.sObjectChangedSubscription);
        unsubscribe(this.infoChangedSubscription);
        this.sObjectChangedSubscription = null;
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