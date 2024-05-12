import { LightningElement, api, wire } from 'lwc';
import { fieldColumns } from "./util";
import { publish, MessageContext } from "lightning/messageService";
import selectedFieldId from "@salesforce/messageChannel/sObjectifyFieldReference__c";

export default class SObjectFieldsDisplay extends LightningElement {
    
    @api defaultSortDirection;
    @api sortDirection;
    @api fieldsData;
    @api objectLabel;
    @api customFieldsCount;
    @api standardFieldsCount;
    @api sObjectIdOrName;

    @wire(MessageContext)
    messageContext;

    //Get Columns
    get columns() {
        return [...fieldColumns];
    }

    handleRowAction(event){
        console.log(`Row action event ::: ${JSON.stringify(event)}`);
        const payload = { selectedFieldId: event.detail.row.fieldId, selectedSObjectId: this.sObjectIdOrName };

        publish(this.messageContext, selectedFieldId, payload);
    }
}