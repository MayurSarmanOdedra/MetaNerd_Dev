import { LightningElement, wire } from 'lwc';
import getSObjectInfo from '@salesforce/apex/MetaNerdController.getSObjectInfo';
import getFieldInfo from '@salesforce/apex/MetaNerdController.getFieldInfo';
import getFieldsReferences from '@salesforce/apex/MetaNerdController.getFieldsReferences';
import { fieldColumns, selectionOptions } from './util';


export default class MetaNerd extends LightningElement {
    isSObjectSelected = false;
    options = undefined;
    recordsData = undefined;
    selectedSObject;
    defaultSortDirection = 'asc';
    sortDirection = 'asc';
    sortedBy;
    selectedOptionValues = [];

    @wire(getSObjectInfo)
    orgSObjects({ error, data}){
        if(data){
            this.options = this.sortData([...data]);
        }else{
            console.log('No Sobjects returned with error');
        }
    }

    //Get SObject Selection Label
    get sObjectSelectionLabel(){
        return this.isSObjectSelected ? 'Selected SObject' : 'Select SObject';
    }

    //Get Data
    get data(){
        if(this.isSObjectSelected && this.columns){
            let filteredRecordsData = [...this.recordsData];
            if(this.selectedOptionValues.includes('customFieldsOnly')){
                filteredRecordsData = this.recordsData.filter((element) => element.isCustom);
            }else if(this.selectedOptionValues.includes('unusedCustomFieldsOnly')){
                //let filteredWithIds = this.recordsData.filter((element) => element.fieldId != undefined).map(ele => ele.fieldId)
                let filteredWithIds = this.recordsData.flatMap((element) => element.fieldId != undefined ? element.fieldId : [])
                getFieldsReferences({
                    fieldIds: filteredWithIds
                }).then((result) => {
                    filteredRecordsData = this.recordsData.filter((element) => result.includes(element.fieldId));
                }).catch((error) => {
                    console.log('Error occured when retrieving field metadata references ::: ' + JSON.stringify(error));
                })
            }
            return filteredRecordsData;
        }
    }

    //Get Columns
    get columns(){
        if(this.isSObjectSelected){
            return [...fieldColumns];
        }
    }

    //get options
    get selectOptions() {
        return [...selectionOptions];
    }

    handleSObjectComboChange(event){
        if(event.detail.value){
            this.isSObjectSelected = true;
            this.selectedSObject = event.detail.value;

            getFieldInfo({
                sObjectName: this.selectedSObject
            }).then((result) => {
                const receivedFields = [...result];
                receivedFields.sort(this.sortBy('label', 1));
                this.recordsData = receivedFields;
            }).catch((error) => {
                console.log('Error occured when retrieving SObject fields. ::: ' + JSON.stringify(error));
            })
        }
    }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.recordsData];

        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.recordsData = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }

    handleSelectOptionChange(event){
        this.selectedOptionValues = event.detail.value;
        console.log('current selection values ::: ' + this.selectedOptionValues);
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

    sortData(dataToSort){
        return dataToSort.sort((a,b) => {
            return (a.label < b.label ? -1 : (a.label > b.label ? 1 : 0))
        })
    }
}