import { LightningElement, wire } from "lwc";
import getSObjectInfo from "@salesforce/apex/SObjectifyController.getSObjectInfo";
import getCustomSObjectId from "@salesforce/apex/SObjectifyController.getCustomSObjectId";
import { 
  publish,
  MessageContext 
} from "lightning/messageService";
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';

export default class SObjectify extends LightningElement {
  selectedSObject;
  selectSObjectIdOrName;
  selectedSObjectLabel;
  options;
  isSObjectSelected = false;
  processing = true;

  @wire(MessageContext)
  messageContext;

  @wire(getSObjectInfo)
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

  async handleSObjectComboChange(event){
    if(!this.isSObjectSelected)
      this.isSObjectSelected = true;
    
    //Start processing
    this.processing = true;

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

  sortOptionsData(dataToSort) {
    return dataToSort.sort((a, b) => {
      return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
    });
  }
}