import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { eventService, ticketService } from "@/lib/supabase";
import { Event, Ticket } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface EventFormProps {
  event?: Event;
  onEventCreated: (event: Event) => void;
}

interface TicketFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity_available: number;
}

const EventForm = ({ event, onEventCreated }: EventFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    image_url: event?.image_url || '',
    date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
    time: event?.time || '',
    location: event?.location || '',
    category: event?.category || '',
    max_capacity: event?.max_capacity || 100,
  });

  const [tickets, setTickets] = useState<TicketFormData[]>([
    {
      name: 'Regular',
      description: 'Standard admission ticket',
      price: 2500,
      currency: 'KSH',
      quantity_available: 100
    }
  ]);

  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTicketChange = (index: number, field: string, value: string | number) => {
    const updatedTickets = [...tickets];
    updatedTickets[index] = {
      ...updatedTickets[index],
      [field]: value
    };
    setTickets(updatedTickets);
  };

  const addTicketType = () => {
    setTickets([...tickets, {
      name: '',
      description: '',
      price: 0,
      currency: 'KSH',
      quantity_available: 0
    }]);
  };

  const removeTicketType = (index: number) => {
    if (tickets.length > 1) {
      setTickets(tickets.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const eventData = {
        ...formData,
        date: new Date(formData.date + 'T00:00:00').toISOString(),
        organizer_id: user.id,
      };

      let savedEvent: Event;

      if (event) {
        // Update existing event
        savedEvent = await eventService.updateEvent(event.id, eventData);
      } else {
        // Create new event
        savedEvent = await eventService.createEvent(eventData);
      }

      // Create/update tickets if not editing (tickets are managed separately when editing)
      if (!event) {
        for (const ticket of tickets) {
          if (ticket.name && ticket.price > 0 && ticket.quantity_available > 0) {
            await ticketService.createTicket({
              event_id: savedEvent.id,
              name: ticket.name,
              description: ticket.description,
              price: ticket.price,
              currency: ticket.currency,
              quantity_available: ticket.quantity_available,
            });
          }
        }
      }

      onEventCreated(savedEvent);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Event Information */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your event"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                placeholder="7:00 PM"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Venue name and address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Comedy">Comedy</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max_capacity">Max Capacity</Label>
              <Input
                id="max_capacity"
                type="number"
                value={formData.max_capacity}
                onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value))}
                min="1"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Types (only show for new events) */}
      {!event && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ticket Types</CardTitle>
            <Button type="button" onClick={addTicketType} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket Type
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {tickets.map((ticket, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Ticket Type {index + 1}</h4>
                  {tickets.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeTicketType(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`ticket-name-${index}`}>Name</Label>
                    <Input
                      id={`ticket-name-${index}`}
                      value={ticket.name}
                      onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                      placeholder="e.g., VIP, Regular, Student"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`ticket-price-${index}`}>Price</Label>
                    <Input
                      id={`ticket-price-${index}`}
                      type="number"
                      value={ticket.price}
                      onChange={(e) => handleTicketChange(index, 'price', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`ticket-description-${index}`}>Description</Label>
                  <Input
                    id={`ticket-description-${index}`}
                    value={ticket.description}
                    onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                    placeholder="Ticket description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`ticket-currency-${index}`}>Currency</Label>
                    <Select 
                      value={ticket.currency} 
                      onValueChange={(value) => handleTicketChange(index, 'currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KSH">KSH</SelectItem>
                        <SelectItem value="UGX">UGX</SelectItem>
                        <SelectItem value="TZS">TZS</SelectItem>
                        <SelectItem value="RWF">RWF</SelectItem>
                        <SelectItem value="ETB">ETB</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`ticket-quantity-${index}`}>Available Quantity</Label>
                    <Input
                      id={`ticket-quantity-${index}`}
                      type="number"
                      value={ticket.quantity_available}
                      onChange={(e) => handleTicketChange(index, 'quantity_available', parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button type="submit" variant="hero" disabled={loading}>
          {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;