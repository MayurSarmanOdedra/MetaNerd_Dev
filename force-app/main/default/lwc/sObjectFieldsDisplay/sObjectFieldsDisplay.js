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
import MyModal from 'c/sObjectFieldReferences';

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
    //Fields related variables
    customFieldsCount = 0;
    standardFieldsCount = 0;

    @wire(MessageContext)
    messageContext;

    //Get Columns
    get columns() {
      return columnsByMetadataInfoMap.get(this.currentInfoLabel);
    }

    get currentLabelIsFields(){
      return this.currentInfoLabel === 'FieldsAndRelationships'
    }

    get totalFields() {
      return Number(this.standardFieldsCount) + Number(this.customFieldsCount);
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
    
    startProcessing() {
      this.processing = true;
    }
    
    stopProcessing() {
      this.processing = false;
    }

    getCustomFieldIds() {
      return this.recordsData
        .filter(record => record.isCustom)
        .map(record => record.id);
    }

    async handleInfoChangedMessage(message){
      this.resetData();
      const fixedInfos = ['FieldsAndRelationships', 'PageLayouts', 'RecordTypes', 'ApexTriggers', 'ValidationRules'];
      this.currentInfoLabel = message.infoLabel;

      if(!fixedInfos.includes(this.currentInfoLabel)){
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
      this.startProcessing();
      let result = await getSObjectMetadataInfo({
        sObjectName: this.sObjectName,
        infoType: this.currentInfoLabel
      });
      result =[...result];
      result.sort(this.sortBy("label", 1))
      //for 'FieldsAndRelationships' info
      if(this.currentLabelIsFields){
        result.sort(this.sortBy('isCustom', -1));
        result = result.map((item) => ({ ...item, 
                                         isStandard: !item.isCustom, 
                                         buttonBrand: (item.isUnused) ? 'destructive' : 'brand', 
                                         recordUrl: this.handleFieldViewMetadataUrl(item.isCustom, item.isCustom ? item.id : item.apiName )
                                      }));
        this.customFieldsCount = result.reduce(
          (accumulator, field) => accumulator + (field.isCustom ? 1 : 0),
          0
        );
        this.standardFieldsCount = result.length - this.customFieldsCount;
      }
      this.recordsData = result;
      //stop processing
      this.stopProcessing();
    }

    handleSObjectComboChange(message){
        //Set variables
        this.sObjectIdOrName = message.sObjectIdOrName;
        this.sObjectName = message.sObjectAPIName;
        this.resetData();
    }

    resetData() {
      this.currentInfoLabel = undefined;
      this.recordsData = undefined;
      this.customFieldsCount = 0;
      this.standardFieldsCount = 0;
    }

    handleRowAction(event){
      const actionName = event.detail.action.name; // get the action name
      const row = event.detail.row; // get the row data

      switch (actionName) {
        case 'view':
          this.handleViewMetadataRecord(row.id)
          break;
        case 'where_is_this_used':
          this.handleWhereIsThisUsed(row.id); // This will be fields only for now
          break;
        case 'view_references':
          this.handleViewReferences(row);
          break;
        default:
          break;
      } 
    }

    handleWhereIsThisUsed(id){
      window.open(`${this.getMetadataObjectManagerUrl(id)}/fieldDependencies`);
    }

    handleFieldViewMetadataUrl(isCustom, labelOrId){
      //Flows will be handled differently than its name
      return `${window.location.origin}/lightning/setup/ObjectManager/${this.sObjectIdOrName}/${this.currentInfoLabel}/${isCustom ? labelOrId.slice(0, -3) : labelOrId }/view`;
    }

    handleViewMetadataRecord(id){
      //Flows will be handled differently than its name
      window.open(`${this.getMetadataObjectManagerUrl(id)}/view`);
    }

    getMetadataObjectManagerUrl(id){
      return `${window.location.origin}/lightning/setup/ObjectManager/${this.sObjectIdOrName}/${this.currentInfoLabel}/${id.slice(0, -3)}`;
    }

    handleViewReferences(row){
      MyModal.open({
          // `label` is not included here in this example.
          // it is set on lightning-modal-header instead
          size: 'medium',
          description: 'Modal for field references'
      });
      const payload = { selectedFieldAPIName: row.apiName, selectedFieldLabel: row.label, selectedFieldId: row.id, selectedSObjectId: this.sObjectIdOrName };
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