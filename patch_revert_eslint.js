import fs from 'fs';

const file = 'src/pages/Operations.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('      const stepsResp = await (supabase', '      // eslint-disable-next-line @typescript-eslint/no-explicit-any\n      const stepsResp = await (supabase');
content = content.replace('    await (supabase\\n      .from("event_response_policies"', '    // eslint-disable-next-line @typescript-eslint/no-explicit-any\\n    await (supabase\\n      .from("event_response_policies"');
content = content.replace('    await (supabase\n      .from("event_response_policies"', '    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    await (supabase\n      .from("event_response_policies"');

fs.writeFileSync(file, content);
