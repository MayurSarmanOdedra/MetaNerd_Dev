import { LightningElement, api, wire } from 'lwc';
import { fieldColumns } from "./util";
import { publish, MessageContext } from "lightning/messageService";
import selectedFieldId from "@salesforce/messageChannel/sObjectifyFieldReference__c";

export default class SObjectFieldsDisplay extends LightningElement {
    
    @api fieldsData;
    @api objectLabel;
    @api customFieldsCount;
    @api standardFieldsCount;
    @api sObjectIdOrName;

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

    handleRowAction(event){
        const payload = { selectedFieldAPIName: event.detail.row.apiName, selectedFieldLabel: event.detail.row.label, selectedFieldId: event.detail.row.fieldId, selectedSObjectId: this.sObjectIdOrName };

        publish(this.messageContext, selectedFieldId, payload);
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