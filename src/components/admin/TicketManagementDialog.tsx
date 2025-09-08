import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Save } from "lucide-react";
import { ticketService, supabase } from "@/lib/supabase";
import { Ticket } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface TicketManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

interface TicketFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity_available: number;
  type: string;
}

const TicketManagementDialog = ({ isOpen, onClose, eventId, eventTitle }: TicketManagementDialogProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketFormData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const initialFormData: TicketFormData = {
    name: '',
    description: '',
    price: 0,
    currency: 'KSH',
    quantity_available: 0,
    type: 'General'
  };

  useEffect(() => {
    if (isOpen && eventId) {
      fetchTickets();
    }
  }, [isOpen, eventId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTicket = async (formData: TicketFormData) => {
    try {
      if (formData.id) {
        // Update existing ticket
        await ticketService.updateTicket(formData.id, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          quantity_available: formData.quantity_available,
          type: formData.type,
        });
      } else {
        // Create new ticket
        await ticketService.createTicket({
          event_id: eventId,
          name: formData.name,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          quantity_available: formData.quantity_available,
          type: formData.type,
        });
      }

      toast({
        title: "Success",
        description: `Ticket ${formData.id ? 'updated' : 'created'} successfully`,
      });

      setEditingTicket(null);
      setShowAddForm(false);
      fetchTickets();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${formData.id ? 'update' : 'create'} ticket`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      await ticketService.deleteTicket(ticketId);
      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });
      fetchTickets();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    }
  };

  const TicketForm = ({ ticket, onSave, onCancel }: { 
    ticket?: TicketFormData; 
    onSave: (data: TicketFormData) => void; 
    onCancel: () => void; 
  }) => {
    const [formData, setFormData] = useState<TicketFormData>(ticket || initialFormData);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{ticket?.id ? 'Edit Ticket' : 'Add New Ticket'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Ticket Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., VIP, Regular, Student"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Ticket Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Early Bird">Early Bird</SelectItem>
                    <SelectItem value="Group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ticket description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KSH">KSH</SelectItem>
                    <SelectItem value="UGX">UGX</SelectItem>
                    <SelectItem value="TZS">TZS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Available Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const totalCapacity = tickets.reduce((sum, ticket) => sum + (ticket.quantity_available || 0) + (ticket.quantity_sold || 0), 0);
  const totalSold = tickets.reduce((sum, ticket) => sum + (ticket.quantity_sold || 0), 0);
  const totalAvailable = tickets.reduce((sum, ticket) => sum + (ticket.quantity_available || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tickets - {eventTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalCapacity}</div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{totalSold}</div>
                <p className="text-sm text-muted-foreground">Tickets Sold</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{totalAvailable}</div>
                <p className="text-sm text-muted-foreground">Available</p>
              </CardContent>
            </Card>
          </div>

          {/* Add New Ticket Form */}
          {showAddForm && (
            <TicketForm
              onSave={handleSaveTicket}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Edit Ticket Form */}
          {editingTicket && (
            <TicketForm
              ticket={editingTicket}
              onSave={handleSaveTicket}
              onCancel={() => setEditingTicket(null)}
            />
          )}

          {/* Existing Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Existing Tickets ({tickets.length})</CardTitle>
              <Button 
                onClick={() => setShowAddForm(true)}
                disabled={showAddForm || editingTicket !== null}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tickets found for this event</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="mt-2"
                    disabled={showAddForm}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{ticket.name}</h4>
                          <Badge variant="outline">{ticket.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium">
                            {ticket.currency} {ticket.price?.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            {ticket.quantity_sold || 0} sold / {ticket.quantity_available || 0} available
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTicket({
                              id: ticket.id,
                              name: ticket.name,
                              description: ticket.description || '',
                              price: ticket.price,
                              currency: ticket.currency || 'KSH',
                              quantity_available: ticket.quantity_available,
                              type: ticket.type || 'General',
                            });
                            setShowAddForm(false);
                          }}
                          disabled={editingTicket !== null || showAddForm}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTicket(ticket.id)}
                          disabled={editingTicket !== null || showAddForm}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketManagementDialog;
