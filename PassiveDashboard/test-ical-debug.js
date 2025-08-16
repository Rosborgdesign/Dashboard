const ICAL = require('ical.js');

const testIcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:20250622T090000Z
DTEND:20250622T100000Z
DTSTAMP:20250622T090000Z
UID:test-event-1@test.com
CREATED:20250622T090000Z
DESCRIPTION:Test meeting event
LAST-MODIFIED:20250622T090000Z
LOCATION:Conference Room A
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Team Meeting
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

console.log('Testing iCal parsing...');
try {
  const jcalData = ICAL.parse(testIcal);
  console.log('✅ ICAL.parse successful');
  
  const comp = new ICAL.Component(jcalData);
  console.log('✅ Component created');
  
  const vevents = comp.getAllSubcomponents('vevent');
  console.log('📅 Found', vevents.length, 'events');
  
  vevents.forEach((vevent, index) => {
    const event = new ICAL.Event(vevent);
    const startDate = event.startDate.toJSDate();
    console.log(`Event ${index + 1}: ${event.summary} on ${startDate.toDateString()}`);
  });
} catch (error) {
  console.error('❌ Error:', error);
}