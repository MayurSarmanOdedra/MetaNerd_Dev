import { LightningElement, wire } from 'lwc';
import { subscribe, unsubscribe, APPLICATION_SCOPE, MessageContext, } from "lightning/messageService";
import selectedFieldId from "@salesforce/messageChannel/sObjectifyFieldReference__c";
import getFieldReferences from "@salesforce/apex/SObjectifyController.getFieldReferences";

const columns = [
    {
        label: 'Component Name',
        fieldName: 'componentName',
    },
    {
        label: 'Component Type',
        fieldName: 'componentType'
    }
];

export default class SObjectFieldReferences extends LightningElement {

    fieldId;
    fieldReferences;
    columns = columns;
    unUsedField = false;
    whereIsThisUsedUrl;

    @wire(MessageContext)
    messageContext;

    // Encapsulate logic for Lightning message service subscribe and unsubsubscribe
    subscribeToMessageChannel() {
        if (!this.subscription) {
        this.subscription = subscribe(
            this.messageContext,
            selectedFieldId,
            (message) => this.handleMessage(message),
            { scope: APPLICATION_SCOPE },
        );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    // Handler for message received by component
    async handleMessage(message) {
        let shortenedField = (message.selectedFieldId).slice(0, (message.selectedFieldId).length - 3);

        const urlPreffix = `${window.location.origin}/p/setup/field/CustomFieldDependencyUi/d?`;
        this.whereIsThisUsedUrl = urlPreffix.concat([`id=${shortenedField}`, `type=${message.selectedSObjectId}`, `retURL=/${shortenedField}`, `setupid=CustomObjects`].join('&'));

        try {
            let result = await getFieldReferences({ fieldId: message.selectedFieldId });
            if(result.length > 0)
                this.fieldReferences = result;
            else {
                this.fieldReferences = undefined;
                this.unUsedField = true;
            }
            this.fieldId = message.selectedFieldId;
        }catch(error){
            console.log(`Error occured when getting field references :: ${JSON.stringify(error)}`);
        } 
    }

    // Standard lifecycle hooks used to subscribe and unsubsubscribe to the message channel
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }
}