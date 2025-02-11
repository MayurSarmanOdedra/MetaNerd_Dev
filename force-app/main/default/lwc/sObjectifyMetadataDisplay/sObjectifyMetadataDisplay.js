//standard imports
import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//custom imports
import { columnsByMetadataInfoMap } from "./columns";
import MyModal from 'c/sObjectifyFieldReferences';
//controller methods
import getSObjectMetadataInfo from "@salesforce/apex/SObjectifyController.getSObjectMetadataInfo";
import deleteFlowVersions from '@salesforce/apex/SObjectifyController.deleteFlowVersions';
//message channels
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

const SHOW_SEARCH_NUMBER = 1;
export default class SObjectFieldsDisplay extends LightningElement {
    //Common variables
    sObjectIdOrName;
    sObjectName;
    recordsData;
    allRecordsBeforeFilter;
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

    get showComponent(){
      return this.currentInfoLabel;
    }

    get currentLabelIsFields(){
      return this.currentInfoLabel === 'FieldsAndRelationships'
    }

    get currentLabelIsFlows(){
      return this.currentInfoLabel === 'Flows'
    }

    get totalFields() {
      return Number(this.standardFieldsCount) + Number(this.customFieldsCount);
    }

    get showSearch(){
      return (this.recordsData && this.recordsData.length > SHOW_SEARCH_NUMBER) 
                || (this.allRecordsBeforeFilter && this.allRecordsBeforeFilter.length > SHOW_SEARCH_NUMBER);
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

    handleKeyUp(evt){
      const isEnterKey = evt.keyCode === 13;
      
      if (isEnterKey && evt.target.value) {
        let currentText = evt.target.value;
        if(!this.allRecordsBeforeFilter){
          this.allRecordsBeforeFilter = this.recordsData;
        }
        this.recordsData = this.recordsData.filter( item => item.label.toLowerCase().includes(currentText.toLowerCase()) || item.apiName.toLowerCase().includes(currentText.toLowerCase));
      }else if(!evt.target.value && this.allRecordsBeforeFilter){
        this.recordsData = this.allRecordsBeforeFilter;
        this.allRecordsBeforeFilter = undefined;
      }
    }

    handleInfoChangedMessage(message){
      //set info label
      this.currentInfoLabel = message.infoLabel;
      //handle Records Fetch
      this.handleRecordsFetch(false);
    }

    async handleRecordsFetch(isRefresh){
      //reset data
      this.resetData(false);
      //Start processing
      this.startProcessing();
      let result = await getSObjectMetadataInfo({
        sObjectName: this.sObjectName,
        infoType: this.currentInfoLabel,
        isRefresh: isRefresh
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
      }else if(this.currentLabelIsFlows){
        result = result.map((item) => ({
          ...item,
          recordUrl: this.handleFlowViewMetadataUrl(item.id, item.activeVersionId)
        }))    
      }
      this.recordsData = result;
      //stop processing
      this.stopProcessing();
    }

    handleSObjectComboChange(message){
      //reset data
      this.resetData(true);
      //Set variables
      this.sObjectIdOrName = message.sObjectIdOrName;
      this.sObjectName = message.sObjectAPIName;
    }

    handleRecordsRefresh(){
      //call fetch records
      this.handleRecordsFetch(true);
    }

    resetData(isHardReset) {
      if(isHardReset){
        this.currentInfoLabel = undefined;
      } 
      this.recordsData = undefined;
      this.allRecordsBeforeFilter = undefined;
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
        case 'view_details_and_versions':
          this.handleViewDetailsAndVersion(row.id);
          break;
        case 'where_is_this_used':
          this.handleWhereIsThisUsed(row.id); // This will be fields only for now
          break;
        case 'view_references':
          this.handleViewReferences(row);
          break;
        case 'delete_inactive_versions':
          this.deleteFlowVersions(row);
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

    handleFlowViewMetadataUrl(id, activeVersionId){
      //Flows will be handled differently than its name
      let prefix = `${window.location.origin}/builder_platform_interaction/flowBuilder.app?flowDefId=${id}`;
      return activeVersionId ? `${prefix}&flowId=${activeVersionId}` : prefix;
    }

    handleViewMetadataRecord(id){
      window.open(`${this.getMetadataObjectManagerUrl(id)}/view`);
    }

    handleViewDetailsAndVersion(flowId){
      window.open(`${window.location.origin}/lightning/setup/Flows/page?address=/${flowId}`);
    }

    getMetadataObjectManagerUrl(id){
      return `${window.location.origin}/lightning/setup/ObjectManager/${this.sObjectIdOrName}/${this.currentInfoLabel}/${id.slice(0, -3)}`;
    }

    async deleteFlowVersions(row){
      if(row.totalVersions > 1 && row.isActive){
        //start processing
        this.startProcessing();
        let res = await deleteFlowVersions({
            flowIds: row.inactiveVersionIds
        });

        if(res){
          //update row
          const rowIndex = this.recordsData.findIndex((item) => item.id === row.id)
          const cloneData = [...this.recordsData];
          cloneData.splice(rowIndex, 1, { ...row, totalVersions: 1 });
          this.recordsData = cloneData;
          const event = new ShowToastEvent({
            title: 'SUCCESS',
            message: 'Flow versions deleted successfully!',
            mode: 'sticky',
            variant: 'success'
          });
          this.dispatchEvent(event);
        }else {
          const event = new ShowToastEvent({
            title: 'ERROR',
            message: 'Something went wrong!',
            mode: 'sticky',
            variant: 'error'
          });
          this.dispatchEvent(event);
        }
        //stop processing
        this.stopProcessing();
      }else {
        const event = new ShowToastEvent({
          title: 'Info',
          message: 'Cannot delete single inactive/active flows!',
          mode: 'sticky'
        });
        this.dispatchEvent(event);
      }
    }

    handleViewReferences(row){
      MyModal.open({
          // `label` is not included here in this example.
          // it is set on lightning-modal-header instead
          size: 'medium',
          description: 'Modal for field references'
      });
      const payload = { selectedFieldAPIName: row.apiName, selectedFieldLabel: row.label, selectedFieldId: row.id, selectedSObjectId: this.sObjectIdOrName, selectedSObjectApiName: this.sObjectName };
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