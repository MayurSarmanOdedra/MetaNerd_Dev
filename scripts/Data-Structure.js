//Sobject Object info

let objectInfo = [
    {
        name: 'Fields', //from salesforce
        count: 0, //from salesforce
        emoji: '😊', //from Jascript
        backgroundColor: 'red' //from Javascript
    },
    {
        name: 'Page Layouts', //from salesforce
        count: 0, //from salesforce
        emoji: '😊', //from Jascript
        backgroundColor: 'red' //from Javascript
    },
    {
        name: 'Record Types', //from salesforce
        count: 0, //from salesforce
        emoji: '😊', //from Jascript
        backgroundColor: 'red' //from Javascript
    },
    {
        name: 'Validation Rules', //from salesforce
        count: 0, //from salesforce
        emoji: '😊', //from Jascript
        backgroundColor: 'red' //from Javascript
    },
    {
        name: 'Flows', //from salesforce
        count: 0, //from salesforce
        emoji: '😊', //from Jascript
        backgroundColor: 'red' //from Javascript
    },
    {
        name: 'Triggers', //from salesforce
        count: 0, //from salesforce
        emoji: '😊', //from Jascript
        backgroundColor: 'red' //from Javascript
    }

]


const fieldColumns = [
    {
        label: 'Label',
        fieldName: 'label',
        sortable: true
    },
    {
        label: 'API Name',
        fieldName: 'apiName',
        sortable: true
    },
    {
        label: 'Is Custom?',
        fieldName: 'isCustom',
        sortable: true,
        type: 'boolean',
        initialWidth: 140
    },
    {
        type: 'button',
        typeAttributes: {
            label: 'View References',
            name: 'view_references',
            disabled: {
                fieldName: 'isStandard'
            },
            variant: 'brand',
        },
        initialWidth: 170

    }
];

const pageLayoutColumns = [
    {
        label: 'Label',
        fieldName: 'label',
        sortable: true,
        type: 'URL'
    },
    {
        label: 'API Name',
        fieldName: 'apiName',
        sortable: true
    },
    {
        type: 'button',
        typeAttributes: {
            label: 'View',
            name: 'view',
            variant: 'brand',
        },
        initialWidth: 170

    }
];