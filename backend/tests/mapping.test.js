const {test} = require('node:test');
const assert = require('node:assert/strict');
const {sanitizeFields, validateAssignments} = require('../mapping');

test('filters sensitive labels and invalid field types', () => {
  const fields = sanitizeFields([
    {id:'sf-1', label:'Full Name', kind:'text'},
    {id:'sf-2', label:'Password', kind:'text'},
    {id:'sf-3', label:'Payment card number', kind:'number'},
    {id:'sf-4', label:'Upload file', kind:'file'},
    {id:'sf-5', label:'Terms consent', kind:'checkbox'}
  ]);
  assert.deepEqual(fields.map(f => f.id), ['sf-1']);
});

test('accepts only explicit valid values for existing fields', () => {
  const fields = sanitizeFields([
    {id:'sf-1', label:'Email', kind:'email'},
    {id:'sf-2', label:'Country', kind:'select', options:[{value:'IN',label:'India'},{value:'US',label:'United States'}]},
    {id:'sf-3', label:'DOB', kind:'date'},
    {id:'sf-4', label:'Notify me', kind:'checkbox'}
  ]);
  const result = validateAssignments([
    {fieldId:'sf-1',value:'hello@example.com'},
    {fieldId:'sf-2',value:'India'},
    {fieldId:'sf-3',value:'14/08/2000'},
    {fieldId:'sf-4',value:'true'},
    {fieldId:'sf-5',value:'invented'},
    {fieldId:'sf-1',value:'repeat@example.com'}
  ], fields);
  assert.deepEqual(result, [{fieldId:'sf-1',value:'hello@example.com'},{fieldId:'sf-2',value:'IN'}]);
});

test('handles radio exact options and boolean checkbox', () => {
  const fields = sanitizeFields([
    {id:'sf-1',label:'Study mode: Online',kind:'radio',options:[{value:'online',label:'Online'}]},
    {id:'sf-2',label:'Remember details',kind:'checkbox'}
  ]);
  assert.deepEqual(validateAssignments([{fieldId:'sf-1', value:'Online'},{fieldId:'sf-2', value:true}], fields), [{fieldId:'sf-1',value:'online'}, {fieldId:'sf-2',value:true}]);
});
