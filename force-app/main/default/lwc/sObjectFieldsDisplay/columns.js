const fieldColumns = [
    {
        label: 'Label (as link)',
        fieldName: 'recordUrl',
        type: 'url',
        typeAttributes: {
            label: {
                fieldName: 'label'
            },
            target: '_blank',
            tooltip: {
                fieldName: 'label'
            }
        },
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
        type: 'boolean'
    },
    {
        label: 'Possibly Unused?',
        fieldName: 'isUnused',
        sortable: true,
        type: 'boolean'
    },
    {
        type: 'button',
        typeAttributes: {
            label: 'View References',
            name: 'view_references',
            disabled: {
                fieldName: 'isStandard'
            },
            variant: {
                fieldName: 'buttonBrand'
            },
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
        label: 'Description',
        fieldName: 'description',
        wrapText: true
    },
    {
        label: 'Is Active',
        fieldName: 'isActive',
        sortable: true,
        type: 'boolean',
        initialWidth: 100
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

const validationRuleColumns = [
    {
        label: 'Rule Name',
        fieldName: 'apiName',
        sortable: true,
        wrapText: true
    },
    {
        label: 'Error Field',
        fieldName: 'errorField',
        wrapText: true,
        sortable: true
    },
    {
        label: 'Error Message',
        fieldName: 'errorMessage',
        wrapText: true
    },
    {
        label: 'Is Active',
        fieldName: 'isActive',
        sortable: true,
        type: 'boolean'
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

const apexTriggerColumns = [
    {
        label: 'Label',
        fieldName: 'label',
        sortable: true,
        wrapText: true
    },
    {
        label: 'Trigger Types(s)',
        fieldName: 'type',
        wrapText: true
    },
    {
        label: 'Is Active',
        fieldName: 'isActive',
        sortable: true,
        type: 'boolean',
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
columnsByMetadataInfoMap.set('FieldsAndRelationships', [...fieldColumns]);
columnsByMetadataInfoMap.set('PageLayouts', [...layoutColumns]);
columnsByMetadataInfoMap.set('RecordTypes', [...recordTypeColumns]);
columnsByMetadataInfoMap.set('ValidationRules', [...validationRuleColumns]);
columnsByMetadataInfoMap.set('ApexTriggers', [...apexTriggerColumns]);


export { columnsByMetadataInfoMap };

