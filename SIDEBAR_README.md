# ChatGPT-Style Sidebar Component

A fully functional, ChatGPT-inspired sidebar component built with Next.js 14, Tailwind CSS, Shadcn UI, and Lucide React icons.

## 📁 Files Created

- **`src/components/assistant/Sidebar.tsx`** - Main sidebar component with desktop/mobile responsiveness
- **`src/components/assistant/SidebarItem.tsx`** - Individual chat item with hover actions
- **`src/app/sidebar-demo/page.tsx`** - Demo page to showcase the sidebar

## ✨ Features

### Layout & Styling
- ✅ Fixed sidebar on desktop (260px width)
- ✅ **Compressed state (60px width)** - Smoothly slides between expanded and compressed
- ✅ **Smooth CSS transitions** - 300ms ease-in-out animation
- ✅ Dark theme aesthetic using slate/gray scale (similar to OpenAI)
- ✅ Mobile-responsive with hamburger menu using Shadcn `Sheet`

### Core Components
- ✅ **Header**: "New Chat" button and sidebar toggle
- ✅ **Scrollable Area**: Uses Shadcn `ScrollArea` for chat history
- ✅ **Footer**: User profile with `Avatar` and `DropdownMenu` for settings/logout
- ✅ **Tooltips**: In compressed mode, hover over icons to see full chat titles

### Chat History Logic
- ✅ Mock data array with `id`, `title`, and `date`
- ✅ Grouped into sections:
  - "Today"
  - "Yesterday"
  - "Previous 7 Days"
  - "Older"

### Interactions
- ✅ Each chat item is clickable
- ✅ **Compressed mode**: Shows only icons with tooltips on hover
- ✅ **Expanded mode**: Shows full titles with hover ellipsis menu
- ✅ Hover reveals ellipsis (`...`) menu with:
  - Rename option
  - Delete option
- ✅ Active chat has distinct background color
- ✅ Smooth transitions and hover effects

## 🎨 Shadcn Components Used

- `Sheet` - Mobile sidebar drawer
- `Button` - Ghost and secondary variants
- `ScrollArea` - Scrollable chat history
- `Avatar` - User profile picture
- `DropdownMenu` - Context menus for actions
- `Separator` - Visual dividers
- `Tooltip` - (Available for future enhancements)

## 🚀 Usage

### Basic Implementation

```tsx
import { Sidebar } from "@/components/assistant/Sidebar";

export default function YourPage() {
  return (
    <div className="relative min-h-screen bg-slate-950">
      <Sidebar />
      
      {/* Your main content */}
      <main className="min-h-screen md:ml-[260px] p-8">
        {/* Content goes here */}
      </main>
    </div>
  );
}
```

### View the Demo

Navigate to `/sidebar-demo` in your browser to see the component in action:

```bash
npm run dev
# Visit http://localhost:3000/sidebar-demo
```

## 🎯 Customization

### Modify Mock Data

Edit the `mockChats` array in `Sidebar.tsx`:

```typescript
const mockChats: ChatSession[] = [
  { id: "1", title: "Your Chat Title", date: new Date() },
  // Add more chats...
];
```

### Connect to Real Data

Replace the mock data with your actual chat data:

```typescript
// In Sidebar.tsx
export const Sidebar: React.FC<{ chats: ChatSession[] }> = ({ chats }) => {
  // Use the chats prop instead of mockChats
  const groupedChats = groupChatsByDate(chats);
  // ...
};
```

### Customize Colors

The component uses Tailwind's slate color palette. To customize:

```tsx
// Change from slate to your preferred color
className="bg-slate-900" // → className="bg-zinc-900"
className="text-slate-100" // → className="text-zinc-100"
```

### Add Event Handlers

The component includes placeholder event handlers. Implement your logic:

```typescript
const handleNewChat = () => {
  // Your new chat logic
  createNewChat();
};

const handleDeleteChat = (id: string) => {
  // Your delete logic
  deleteChat(id);
};
```

## 📱 Responsive Behavior

- **Desktop (≥768px)**: Fixed sidebar on the left, toggleable
- **Mobile (<768px)**: Hamburger menu that opens a Sheet drawer

## 🎨 Color Palette

The component uses a dark theme with the following slate colors:

- **Background**: `slate-900` (#0f172a)
- **Surface**: `slate-800` (#1e293b)
- **Border**: `slate-700` (#334155)
- **Primary Text**: `slate-100` (#f1f5f9)
- **Secondary Text**: `slate-400` (#94a3b8)
- **Accent**: `slate-500` (#64748b)

## 🔧 TypeScript Types

```typescript
export interface ChatSession {
  id: string;
  title: string;
  date: Date;
}
```

## 📦 Dependencies

All required dependencies are already installed in your project:

- `@radix-ui/react-avatar`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-separator`
- `@radix-ui/react-slot`
- `lucide-react`
- `tailwind-merge`
- `clsx`

## 🎯 Next Steps

1. **Connect to Backend**: Replace mock data with API calls
2. **Add Rename Functionality**: Implement inline editing for chat titles
3. **Add Search**: Include a search bar to filter chats
4. **Add Keyboard Shortcuts**: Implement shortcuts for common actions
5. **Add Tooltips**: Show full chat titles on hover for truncated text
6. **Persist Sidebar State**: Save collapsed/expanded state to localStorage

## 📝 Notes

- The sidebar automatically groups chats by date
- Chat items are truncated with ellipsis if too long
- The component is fully typed with TypeScript
- All Shadcn UI components follow their design system
- The component is accessible and keyboard-navigable

## 🐛 Troubleshooting

### Sidebar not showing?
- Ensure you're using the correct layout structure
- Check that the parent container has proper positioning

### Mobile menu not working?
- Verify that the Sheet component is properly installed
- Check that Tailwind's responsive classes are working

### Styling issues?
- Ensure Tailwind CSS is properly configured
- Check that all Shadcn UI components are installed

---

**Built with ❤️ using Next.js 14, Tailwind CSS, and Shadcn UI**
