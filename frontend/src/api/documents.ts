const API_BASE_URL = 'http://localhost:8080';

export interface Document {
  filePath: string;
  content: string;
}

export const documentsApi = {
  async getDocument(filePath: string): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(filePath)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }
    return response.json();
  },

  async createDocument(document: Document): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(document),
    });
    if (!response.ok) {
      throw new Error(`Failed to create document: ${response.statusText}`);
    }
    return response.json();
  },

  async updateDocument(filePath: string, content: string): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, content }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update document: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteDocument(filePath: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
  },

  async listDocuments(): Promise<Document[]> {
    const response = await fetch(`${API_BASE_URL}/documents`);
    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.statusText}`);
    }
    return response.json();
  },
}; 