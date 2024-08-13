import { LightningElement, wire } from 'lwc';
import { subscribe, MessageContext, APPLICATION_SCOPE, unsubscribe } from 'lightning/messageService';
import sObjectChanged from '@salesforce/messageChannel/selectedSObjectChanged__c';

export default class APILimitationTextFooter extends LightningElement {
    isVisible = false;
    sObjectChangedSubscription = null;
    
    @wire(MessageContext)
    messageContext;

    connectedCallback(){
        if(!this.sObjectChangedSubscription){
            this.sObjectChangedSubscription = subscribe(
                this.messageContext,
                sObjectChanged,
                (message) => this.isVisible = true,
                { scope: APPLICATION_SCOPE }
            );
        }
    }

    disconnectedCallback(){
        if(this.sObjectChangedSubscription){
            unsubscribe(this.sObjectChangedSubscription);
            this.sObjectChangedSubscription = null;
        }
    }


}