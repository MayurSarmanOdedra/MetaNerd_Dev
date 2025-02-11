import { LightningElement, wire } from "lwc";
import { objectInfo } from './infoDataModel';
import getAllSObjects from "@salesforce/apex/SObjectifyController.getAllSObjects";
import getSObjectMetadataCountInfo from "@salesforce/apex/SObjectifyController.getSObjectMetadataCountInfo";
import getCustomSObjectId from "@salesforce/apex/SObjectifyController.getCustomSObjectId";
import infoChanged from "@salesforce/messageChannel/sObjectifyInfoChanged__c";
import { 
  publish,
  MessageContext 
} from "lightning/messageService";
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';

const DEFAULT_INFO_CLASSES = ['slds-box', 'slds-align_absolute-center', 'slds-grid', 'slds-grid_vertical', 'slds-wrap'];
export default class SObjectify extends LightningElement {
  selectedSObject;
  selectSObjectIdOrName;
  selectedSObjectLabel;
  options;
  isSObjectSelected = false;
  processing = true;
  sObjectInfo;
  currTarget;

  @wire(MessageContext)
  messageContext;

  @wire(getAllSObjects)
  orgSObjects({ error, data }) {
    if (data) {
      this.options = this.sortOptionsData([...data]);
      this.processing = false;
    } else {
      console.log("No Sobjects returned with error");
    }
  }

  //Get SObject Selection Label
  get sObjectSelectionLabel() {
    return this.isSObjectSelected ? "Selected SObject" : "Select SObject";
  }

  handleInfoClick(event){
    if(event.target.dataset.count > 0){
      if(this.currTarget) this.currTarget.classList.remove('selected-info');
      event.target.classList.add('selected-info');
      this.currTarget = event.target;
      publish(this.messageContext, infoChanged, { infoLabel: event.target.dataset.id });
    }
  }

  async handleSObjectComboChange(event){
    if(!this.isSObjectSelected)
      this.isSObjectSelected = true;
    
    //Start processing
    this.processing = true;

    //remove info current target
    if(this.currTarget) this.currTarget.classList.remove('selected-info');

    this.selectedSObject = event.detail.value;
    this.selectedSObjectLabel = event.target.options.find(opt => opt.value === event.detail.value).label.split(' - ')[0];

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
      let data = await getSObjectMetadataCountInfo({
        sObjectName: this.selectedSObject
      });

      objectInfo.forEach( item => {
          item.count = data[item.name];
          item.classes = [item.count === 0 ? 'info-zero-count' : 'info', ...DEFAULT_INFO_CLASSES].join(' ');
      })

      this.sObjectInfo = [...objectInfo]
    } catch (error) {
      console.log(
        `Error occured when retrieving SObject Info. ::: ${JSON.stringify(
          error
        )}`
      );
    }

    //Publish SObject change event with sObjectLabel, sObjectAPIName, and sObjectIdOrName
    let payload = { 
      sObjectLabel: this.selectedSObjectLabel,
      sObjectAPIName: this.selectedSObject,
      sObjectIdOrName: this.selectSObjectIdOrName
    };
    publish(this.messageContext, sObjectChanged, payload);

    //Stop processing
    this.processing = false;
  }

  handleViewSObjectClick(){
    window.open(`${window.location.origin}/lightning/setup/ObjectManager/${this.selectSObjectIdOrName}/Details/view`);
  }

  sortOptionsData(dataToSort) {
    return dataToSort.sort((a, b) => {
      return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
    });
  }
}