const fieldColumns = [
    {
        label: 'Label',
        fieldName: 'label',
        sortable: true,
        wrapText: true
    },
    {
        label: 'API Name',
        fieldName: 'apiName',
        sortable: true,
        wrapText: true
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

const layoutColumns = [
    {
        label: 'Label',
        fieldName: 'label',
        sortable: true,
        wrapText: true
    },
    {
        label: 'Type',
        fieldName: 'type',
        sortable: true,
        wrapText: true
    },
    {
        type: 'button',
        typeAttributes: {
            label: 'View',
            name: 'view',
            variant: 'brand',
        },
        initialWidth: 100

    }
];

const recordTypeColumns = [
    {
        label: 'Label',
        fieldName: 'label',
        sortable: true,
        wrapText: true
    },
    {
        label: 'API Name',
        fieldName: 'apiName',
        sortable: true,
        wrapText: true
    },
    {
        label: 'Is Active',
        fieldName: 'isActive',
        sortable: true,
        type: 'boolean',
        wrapText: true
    },
    {
        label: 'Description',
        fieldName: 'description',
        wrapText: true
    },
    {
        type: 'button',
        typeAttributes: {
            label: 'View',
            name: 'view',
            variant: 'brand',
        },
        initialWidth: 100
    }
];

const columnsByMetadataInfoMap = new Map();
columnsByMetadataInfoMap.set('Fields', [...fieldColumns]);
columnsByMetadataInfoMap.set('Page Layouts', [...layoutColumns]);
columnsByMetadataInfoMap.set('Record Types', [...recordTypeColumns]);

export { columnsByMetadataInfoMap };