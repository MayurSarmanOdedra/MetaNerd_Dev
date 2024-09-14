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