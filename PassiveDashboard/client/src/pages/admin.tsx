import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DashboardConfig, CalendarConfig, TransportStop } from "@shared/schema";

function TransportStopsSection({ config, onSave }: { config: any, onSave: (config: any) => void }) {
  const [newStop, setNewStop] = useState({ id: "", name: "", type: "bus" as const, active: true });
  const [showAddDialog, setShowAddDialog] = useState(false);

  const transportStops = (config?.transportStops as TransportStop[]) || [];

  const handleAddStop = () => {
    if (!newStop.id || !newStop.name) return;
    
    const updatedStops = [...transportStops, newStop];
    const newConfig = {
      ...config,
      transportStops: updatedStops
    };
    onSave(newConfig);
    setNewStop({ id: "", name: "", type: "bus", active: true });
    setShowAddDialog(false);
  };

  const handleRemoveStop = (stopId: string) => {
    const updatedStops = transportStops.filter(stop => stop.id !== stopId);
    const newConfig = {
      ...config,
      transportStops: updatedStops
    };
    onSave(newConfig);
  };

  const handleToggleStop = (stopId: string) => {
    const updatedStops = transportStops.map(stop => 
      stop.id === stopId ? { ...stop, active: !stop.active } : stop
    );
    const newConfig = {
      ...config,
      transportStops: updatedStops
    };
    onSave(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transport Stops</CardTitle>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Stop
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transportStops.map((stop) => (
            <div key={stop.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{stop.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">ID: {stop.id}</span>
                  <Switch
                    checked={stop.active}
                    onCheckedChange={() => handleToggleStop(stop.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStop(stop.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="capitalize">{stop.type}</span>
                <span className={stop.active ? "text-green-600" : "text-red-600"}>
                  {stop.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
          
          {transportStops.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Inga hållplatser konfigurerade.</p>
              <p className="text-sm">Lägg till hållplatser för att visa realtidsavgångar på dashboarden.</p>
            </div>
          )}
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till hållplats</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stopId">Stop ID (från Resrobot)</Label>
                <Input
                  id="stopId"
                  value={newStop.id}
                  onChange={(e) => setNewStop(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="t.ex. 740000001"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hitta stop-ID på resrobot.se eller använd Resrobot Location API
                </p>
              </div>
              <div>
                <Label htmlFor="stopName">Hållplatsnamn</Label>
                <Input
                  id="stopName"
                  value={newStop.name}
                  onChange={(e) => setNewStop(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="t.ex. Stockholms central"
                />
              </div>
              <div>
                <Label htmlFor="stopType">Transporttyp</Label>
                <Select
                  value={newStop.type}
                  onValueChange={(value: any) => setNewStop(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">Buss</SelectItem>
                    <SelectItem value="train">Tåg</SelectItem>
                    <SelectItem value="metro">Tunnelbana</SelectItem>
                    <SelectItem value="tram">Spårvagn</SelectItem>
                    <SelectItem value="boat">Båt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Avbryt
                </Button>
                <Button 
                  onClick={handleAddStop}
                  disabled={!newStop.id || !newStop.name}
                >
                  Lägg till
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const { toast } = useToast();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["/api/config"],
    enabled: isAuthenticated,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      setShowLogin(false);
      toast({ title: "Login successful" });
    },
    onError: () => {
      toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: Partial<DashboardConfig>) => {
      const response = await apiRequest("PUT", "/api/config", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Configuration updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update configuration", variant: "destructive" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  const handleSaveConfig = (newConfig: Partial<DashboardConfig>) => {
    updateConfigMutation.mutate(newConfig);
  };

  if (showLogin) {
    return (
      <Dialog open={showLogin} onOpenChange={() => setLocation("/")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto pb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard Configuration</h1>
          <Button onClick={() => setLocation("/")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Moodboard Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Moodboard Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayTime">Display Time (seconds)</Label>
                  <Input
                    id="displayTime"
                    type="number"
                    min="10"
                    max="300"
                    value={config?.moodboardSettings?.displayTime || 40}
                    onChange={(e) => {
                      const newConfig = {
                        ...config,
                        moodboardSettings: {
                          ...config?.moodboardSettings,
                          displayTime: parseInt(e.target.value)
                        }
                      };
                      handleSaveConfig(newConfig);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="transition">Transition Type</Label>
                  <Select
                    value={config?.moodboardSettings?.transitionType || "fade"}
                    onValueChange={(value) => {
                      const newConfig = {
                        ...config,
                        moodboardSettings: {
                          ...config?.moodboardSettings,
                          transitionType: value
                        }
                      };
                      handleSaveConfig(newConfig);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="driveFolder">Google Drive Folder ID</Label>
                <Input
                  id="driveFolder"
                  type="text"
                  placeholder="Enter Google Drive folder ID"
                  value={config?.moodboardSettings?.googleDriveFolderId || ""}
                  onChange={(e) => {
                    const newConfig = {
                      ...config,
                      moodboardSettings: {
                        ...config?.moodboardSettings,
                        googleDriveFolderId: e.target.value
                      }
                    };
                    handleSaveConfig(newConfig);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Transport Settings */}
          <TransportStopsSection config={config} onSave={handleSaveConfig} />

          {/* Calendar Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="refreshInterval">Refresh Interval (minutes)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  min="5"
                  max="60"
                  value={config?.calendarSettings?.refreshInterval || 20}
                  onChange={(e) => {
                    const newConfig = {
                      ...config,
                      calendarSettings: {
                        ...config?.calendarSettings,
                        refreshInterval: parseInt(e.target.value)
                      }
                    };
                    handleSaveConfig(newConfig);
                  }}
                />
              </div>

              {/* Calendar Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Calendars</Label>
                  <Button
                    onClick={() => {
                      const newCalendar = {
                        id: Date.now().toString(),
                        name: "New Calendar",
                        color: "#4285F4",
                        enabled: true,
                        googleCalendarId: ""
                      };
                      const newConfig = {
                        ...config,
                        calendarSettings: {
                          ...config?.calendarSettings,
                          calendars: [...(config?.calendarSettings?.calendars || []), newCalendar]
                        }
                      };
                      handleSaveConfig(newConfig);
                    }}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Calendar
                  </Button>
                </div>

                <div className="space-y-3">
                  {config?.calendarSettings?.calendars?.map((calendar: CalendarConfig, index: number) => (
                    <div key={calendar.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-1">
                          <Switch
                            checked={calendar.enabled}
                            onCheckedChange={(enabled) => {
                              const updatedCalendars = [...(config?.calendarSettings?.calendars || [])];
                              updatedCalendars[index] = { ...calendar, enabled };
                              const newConfig = {
                                ...config,
                                calendarSettings: {
                                  ...config?.calendarSettings,
                                  calendars: updatedCalendars
                                }
                              };
                              handleSaveConfig(newConfig);
                            }}
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <Input
                            value={calendar.name}
                            onChange={(e) => {
                              const updatedCalendars = [...(config?.calendarSettings?.calendars || [])];
                              updatedCalendars[index] = { ...calendar, name: e.target.value };
                              const newConfig = {
                                ...config,
                                calendarSettings: {
                                  ...config?.calendarSettings,
                                  calendars: updatedCalendars
                                }
                              };
                              handleSaveConfig(newConfig);
                            }}
                            placeholder="Calendar Name"
                          />
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={calendar.color}
                              onChange={(e) => {
                                const updatedCalendars = [...(config?.calendarSettings?.calendars || [])];
                                updatedCalendars[index] = { ...calendar, color: e.target.value };
                                const newConfig = {
                                  ...config,
                                  calendarSettings: {
                                    ...config?.calendarSettings,
                                    calendars: updatedCalendars
                                  }
                                };
                                handleSaveConfig(newConfig);
                              }}
                              className="w-8 h-8 border rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-600">Color</span>
                          </div>
                        </div>

                        <div className="col-span-5">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept=".ics,.ical"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const icalData = event.target?.result as string;
                                      const updatedCalendars = [...(config?.calendarSettings?.calendars || [])];
                                      updatedCalendars[index] = { ...calendar, icalData, icalUrl: file.name };
                                      const newConfig = {
                                        ...config,
                                        calendarSettings: {
                                          ...config?.calendarSettings,
                                          calendars: updatedCalendars
                                        }
                                      };
                                      handleSaveConfig(newConfig);
                                    };
                                    reader.readAsText(file);
                                  }
                                }}
                                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </div>
                            {calendar.icalUrl && (
                              <div className="text-xs text-green-600 flex items-center space-x-1">
                                <span>✓</span>
                                <span>{calendar.icalUrl}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1">
                          <Button
                            onClick={() => {
                              const updatedCalendars = config?.calendarSettings?.calendars?.filter(
                                (_, i) => i !== index
                              ) || [];
                              const newConfig = {
                                ...config,
                                calendarSettings: {
                                  ...config?.calendarSettings,
                                  calendars: updatedCalendars
                                }
                              };
                              handleSaveConfig(newConfig);
                            }}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>iCal Upload:</strong> Ladda upp .ics filer från din kalenderapp (Google Calendar, Outlook, Apple Calendar, etc.). 
                  Exportera din kalender som .ics fil och ladda upp den här för att visa riktiga händelser på dashboarden.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Så här exporterar du: Google Calendar → Inställningar → Exportera → Ladda ner .ics fil
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
