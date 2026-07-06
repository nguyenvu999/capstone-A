import { useState } from "react";
import { X, Mail, Send } from "lucide-react";

export default function NotificationCenter({ onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("all"); // "all" | "active" | "email"
  const [specificEmail, setSpecificEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      alert("Please fill in subject and message");
      return;
    }

    if (recipient === "email" && !specificEmail.trim()) {
      alert("Please enter recipient email");
      return;
    }

    setSending(true);
    
    // Mock API call
    setTimeout(() => {
      alert(`Email sent to: ${recipient === "all" ? "All users" : recipient === "active" ? "Active users" : specificEmail}`);
      setSending(false);
      setSubject("");
      setMessage("");
      setSpecificEmail("");
    }, 1000);
  };

  return (
    <div className="fixed top-0 md:top-20 right-0 md:right-6 left-0 md:left-auto bottom-0 md:bottom-auto z-[999] w-full md:w-[450px] h-full md:h-auto max-h-full md:max-h-[calc(100vh-120px)] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-gray-800">Send Email Notification</h2>
            <p className="text-xs text-gray-500 mt-0.5">Send email to users</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSend} className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
        
        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
          <div className="space-y-2">
            {["all", "active", "email"].map(type => (
              <label key={type} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all">
                <input
                  type="radio"
                  name="recipient"
                  value={type}
                  checked={recipient === type}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  {type === "all" && "All users"}
                  {type === "active" && "Active users only"}
                  {type === "email" && "Specific email"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Specific Email Input */}
        {recipient === "email" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={specificEmail}
              onChange={(e) => setSpecificEmail(e.target.value)}
              placeholder="user@netcompany.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              required={recipient === "email"}
            />
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Write your message here..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-all"
            required
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {sending ? "Sending..." : "Send Email"}
        </button>
      </form>
    </div>
  );
}