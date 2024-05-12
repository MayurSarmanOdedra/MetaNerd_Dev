import { LightningElement, wire } from 'lwc';
import getSObjectInfo from "@salesforce/apex/SObjectifyController.getSObjectInfo";
import getFieldInfo from "@salesforce/apex/SObjectifyController.getFieldInfo";
import getCustomSObjectId from "@salesforce/apex/SObjectifyController.getCustomSObjectId";

export default class SObjectify extends LightningElement {
    options = undefined;
    selectedSObject;
    selectSObjectIdOrName;
    selectedSObjectLabel;
    defaultSortDirection = "asc";
    sortDirection = "asc";
    sortedBy;
    recordsData = undefined;
    customFieldsCount = 0
    standardFieldsCount = 0
    processing = true

    @wire(getSObjectInfo)
    orgSObjects({ error, data }) {
        if (data) {
            data = this.sortData([...data]);
            const optionsProxy = [];
            data.forEach( option => optionsProxy.push(option));
            this.options = optionsProxy;
            this.processing = false;
        } else {
            console.log("No Sobjects returned with error");
        }
    }

    //sObjectSelector method
    async handleSObjectChange(event) {
        if (event.detail) {
            this.selectedSObject = event.detail;
            this.selectedSObjectLabel = this.options.filter( opt => opt.value === event.detail)[0].label;

            //Start processing
            this.processing = true;

            try {
                this.selectSObjectIdOrName = await getCustomSObjectId({ sObjectName: this.selectedSObject });
            }catch(error){
                console.log(`Error occured when retrieving SObject Id. ::: ${JSON.stringify(error)}`);
            }

            try {
                const result = await getFieldInfo({ sObjectName: this.selectedSObject, sObjectId: this.selectSObjectIdOrName })
                const receivedFields = [...result].sort(this.sortBy("label", 1))
                                                  .map(item => ({ ...item, isStandard: !item.isCustom }));
                this.customFieldsCount = receivedFields.reduce((accumulator, field) => accumulator + (field.isCustom ? 1 : 0),0);
                this.standardFieldsCount = receivedFields.length - this.customFieldsCount;
                this.recordsData = receivedFields;
            } catch(error) {
                console.log(`Error occured when retrieving SObject fields. ::: ${JSON.stringify(error)}`);
            }
            //stop processing
            this.processing = false;
        }
    }

    //sObjectSelector method
    sortData(dataToSort) {
        return dataToSort.sort((a, b) => {
            return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
        });
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