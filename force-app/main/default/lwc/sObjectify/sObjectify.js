import { LightningElement, wire } from 'lwc';
import getSObjectInfo from "@salesforce/apex/SObjectifyController.getSObjectInfo";
import getFieldInfo from "@salesforce/apex/SObjectifyController.getFieldInfo";

export default class SObjectify extends LightningElement {
    options = undefined;
    selectedSObject;
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
            this.options = this.sortData([...data]);
            this.processing = false;
        } else {
            console.log("No Sobjects returned with error");
        }
    }

    //sObjectSelector method
    handleSObjectChange(event) {
        if (event.detail) {
            this.selectedSObject = event.detail;
            this.selectedSObjectLabel = this.options.filter( opt => opt.value === event.detail)[0].label;

            //Start processing
            this.processing = true;

            getFieldInfo({
                sObjectName: this.selectedSObject,
            })
            .then((result) => {
                const receivedFields = [...result].sort(this.sortBy("label", 1));
                this.customFieldsCount = receivedFields.reduce((accumulator, field) => accumulator + (field.isCustom ? 1 : 0),0);
                this.standardFieldsCount = receivedFields.length - this.customFieldsCount;
                this.recordsData = receivedFields;
                this.processing = false;
            })
            .catch((error) => {
                console.log(
                "Error occured when retrieving SObject fields. ::: " +
                    JSON.stringify(error)
                );
            });
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