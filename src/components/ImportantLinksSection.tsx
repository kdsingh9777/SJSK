import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, 
  Globe, 
  Plus, 
  Search, 
  Building2, 
  Sparkles, 
  Trash2, 
  Edit3, 
  X, 
  Link2, 
  ShieldCheck,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { ImportantLink } from '../types';
import { getImportantLinks, saveImportantLink, deleteImportantLink } from '../lib/storage';

export const ImportantLinksSection: React.FC = () => {
  const [links, setLinks] = useState<ImportantLink[]>(() => getImportantLinks());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Modal State for Adding / Editing Custom Link
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ImportantLink | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    url: string;
    category: ImportantLink['category'];
    description: string;
    badgeText: string;
  }>({
    title: '',
    url: '',
    category: 'Custom',
    description: '',
    badgeText: 'Custom Portal',
  });

  const [linkToDelete, setLinkToDelete] = useState<ImportantLink | null>(null);

  // Categories list
  const categories = ['All', 'CSC Portal', 'Certificates', 'PAN & Aadhaar', 'Scholarship', 'Govt Portal', 'Utility Services', 'Custom'];

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesCat = activeCategory === 'All' || link.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        link.title.toLowerCase().includes(q) ||
        link.description.toLowerCase().includes(q) ||
        link.category.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [links, activeCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingLink(null);
    setFormData({
      title: '',
      url: '',
      category: 'Custom',
      description: '',
      badgeText: 'Custom Link',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (link: ImportantLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category,
      description: link.description,
      badgeText: link.badgeText || 'Custom Link',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) return;

    let formattedUrl = formData.url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newOrUpdatedLink: ImportantLink = {
      id: editingLink ? editingLink.id : `link-cust-${Date.now()}`,
      title: formData.title.trim(),
      url: formattedUrl,
      category: formData.category,
      description: formData.description.trim() || 'Custom portal quick launcher link',
      badgeText: formData.badgeText.trim() || 'Custom Link',
      isCustom: editingLink ? editingLink.isCustom : true,
      createdAt: editingLink?.createdAt || new Date().toISOString(),
    };

    const updatedList = saveImportantLink(newOrUpdatedLink);
    setLinks(updatedList);
    setIsAddModalOpen(false);
    setEditingLink(null);
  };

  const handleDelete = (id: string) => {
    const updated = deleteImportantLink(id);
    setLinks(updated);
    setLinkToDelete(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold border border-amber-200/80 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>CSC व सरकारी पोर्टल क्विक लॉन्चर</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <span>Important Links & Portals Launcher</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant access to official government websites, CSC services, PAN, Scholarship, & custom portals
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Portal URL</span>
        </button>
      </div>

      {/* Search Bar & Category Filter Chips */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search portals (e.g. e-District, PAN, Scholarship, Aadhaar, PM Kisan)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium whitespace-nowrap shrink-0">
            Showing <strong className="text-slate-900">{filteredLinks.length}</strong> links
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Links Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredLinks.map((link) => (
          <div
            key={link.id}
            className="group relative bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold">
                  <Bookmark className="w-2.5 h-2.5" />
                  <span>{link.badgeText || link.category}</span>
                </span>

                <div className="flex items-center gap-1">
                  {link.isCustom && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold rounded">
                      CUSTOM
                    </span>
                  )}
                  {link.isCustom && (
                    <button
                      onClick={() => handleOpenEditModal(link)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                      title="Edit Link"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {link.isCustom && (
                    <button
                      onClick={() => setLinkToDelete(link)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete Link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition">
                  {link.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                  {link.description}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[170px]">
                {link.url.replace(/^https?:\/\//, '')}
              </span>

              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition group-hover:scale-105 shrink-0"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}

        {filteredLinks.length === 0 && (
          <div className="col-span-full py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No portal links found matching search</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or add a custom portal URL</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              + Add Custom URL
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingLink ? 'Edit Custom Portal Link' : 'Add Custom Portal URL'}
                  </h3>
                  <p className="text-xs text-slate-500">Add custom government or service web links</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Portal / Website Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UP State Electricity Bill Portal"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Portal Web Address (URL) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://uppcl.mpower.in or upbhulekh.gov.in"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="CSC Portal">CSC Portal</option>
                    <option value="Certificates">Certificates</option>
                    <option value="PAN & Aadhaar">PAN & Aadhaar</option>
                    <option value="Scholarship">Scholarship</option>
                    <option value="Govt Portal">Govt Portal</option>
                    <option value="Utility Services">Utility Services</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. UPPCL / Bill"
                    value={formData.badgeText}
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief note about what this portal is used for..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  {editingLink ? 'Update Link' : 'Save Custom Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {linkToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Custom Link</h3>
                <p className="text-xs text-slate-500">Remove from quick launcher</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{linkToDelete.title}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setLinkToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(linkToDelete.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Delete Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
