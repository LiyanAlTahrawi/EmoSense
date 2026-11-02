/**
 * PREVIEW-ONLY SAMPLE CONTENT.
 * Used exclusively by services/demoApi.ts when authentication isn't configured.
 * Never mixed with real accounts; labels below are sample values, not model output.
 */
export interface DemoMessageSeed {
  role: 'user' | 'assistant';
  content: string;
  inputType: 'text' | 'audio';
  minutesAfter: number;
  sampleEmotion?: string;
}

export interface DemoConversationSeed {
  id: string;
  title: string;
  hoursAgo: number;
  messages: DemoMessageSeed[];
}

export const demoProfile = {
  userId: 'demo-user',
  firstName: 'Alex',
  lastName: 'Rivera',
  phoneNumber: null
};

export const demoConversations: DemoConversationSeed[] = [
{
  id: 'demo-presentation',
  title: 'Getting ready for the presentation',
  hoursAgo: 3,
  messages: [
  {
    role: 'user',
    inputType: 'audio',
    minutesAfter: 0,
    sampleEmotion: 'fearful',
    content:
    "I have to present my project tomorrow and I keep running through it in my head. I know the material, but my chest gets tight every time I picture the room."
  },
  {
    role: 'assistant',
    inputType: 'text',
    minutesAfter: 1,
    content:
    "That tightness makes sense — tomorrow matters to you, and your body is treating it that way. It sounds like the worry isn't about knowing the material, but about being seen while you share it.\n\nWould it help to walk through the first two minutes together? Openings tend to carry most of the nerves."
  },
  {
    role: 'user',
    inputType: 'text',
    minutesAfter: 4,
    sampleEmotion: 'neutral',
    content: "Yes, the opening is the hardest part. Once I'm talking about the models I'm fine."
  }]

},
{
  id: 'demo-evening',
  title: 'A slower evening',
  hoursAgo: 27,
  messages: [
  {
    role: 'user',
    inputType: 'text',
    minutesAfter: 0,
    sampleEmotion: 'happy',
    content:
    "Finally had an evening with nothing scheduled. I cooked, called my sister, and didn't open my laptop once."
  },
  {
    role: 'assistant',
    inputType: 'text',
    minutesAfter: 1,
    content:
    "That sounds like an evening that gave something back to you. What made it possible to step away from the laptop tonight?"
  }]

},
{
  id: 'demo-stretched',
  title: 'Feeling stretched thin',
  hoursAgo: 96,
  messages: [
  {
    role: 'user',
    inputType: 'audio',
    minutesAfter: 0,
    sampleEmotion: 'sad',
    content:
    "Between work and the thesis I feel like I'm always behind. I'm not even sure what I'd do with free time anymore."
  },
  {
    role: 'assistant',
    inputType: 'text',
    minutesAfter: 1,
    content:
    "Being behind on everything at once is exhausting, and it can make rest feel unfamiliar rather than relieving. You don't have to solve the whole schedule right now — what's one thing this week that feels heaviest?"
  }]

},
{
  id: 'demo-semester',
  title: 'Thinking about next semester',
  hoursAgo: 24 * 19,
  messages: [
  {
    role: 'user',
    inputType: 'text',
    minutesAfter: 0,
    sampleEmotion: 'neutral',
    content: "I'm trying to decide between two elective courses and keep going back and forth."
  }]

}];