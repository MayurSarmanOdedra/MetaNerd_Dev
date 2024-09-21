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

const unusedColumns = [
    {
      label: "Label",
      fieldName: "label",
      wrapText: true,
    },
    {
      label: "API Name",
      fieldName: "apiName",
    },
    {
      type: "button",
      typeAttributes: {
        label: "Where is this used?",
        name: "where_is_this_used",
        disabled: false,
        variant: "brand-outline",
      },
      initialWidth: 170,
    },
    {
      type: "button",
      typeAttributes: {
        label: 'Delete',
        alternativeText: "Delete",
        name: "delete",
        disabled: false,
        variant: "destructive",
      },
      initialWidth: 90,
    },
];

const columnsByMetadataInfoMap = new Map();
columnsByMetadataInfoMap.set('FieldsAndRelationships', [...fieldColumns]);
columnsByMetadataInfoMap.set('FieldsAndRelationships.Unused', [...unusedColumns]);
columnsByMetadataInfoMap.set('PageLayouts', [...layoutColumns]);
columnsByMetadataInfoMap.set('RecordTypes', [...recordTypeColumns]);
columnsByMetadataInfoMap.set('ApexTriggers', [...apexTriggerColumns]);


export { columnsByMetadataInfoMap };