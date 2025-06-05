import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Settings, Volume2, Bell, Palette } from "lucide-react"

type TimerMode = "focus" | "break"

interface TimerSettings {
    focusTime: number
    breakTime: number
    longBreakTime: number
    longBreakInterval: number
    autoStart: boolean
    soundEnabled: boolean
    soundVolume: number
    notifications: boolean
}

export default function PomodoroTimer() {
    const [mode, setMode] = useState<TimerMode>("focus")
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)
    const [sessions, setSessions] = useState(0)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const [settings, setSettings] = useState<TimerSettings>({
        focusTime: 25,
        breakTime: 5,
        longBreakTime: 15,
        longBreakInterval: 4,
        autoStart: false,
        soundEnabled: true,
        soundVolume: 50,
        notifications: true,
    })

    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (mode === "focus") {
            setTimeLeft(settings.focusTime * 60)
        } else {
            setTimeLeft(settings.breakTime * 60)
        }
    }, [settings.focusTime, settings.breakTime])

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, timeLeft])

    const handleTimerComplete = () => {
        setIsRunning(false)

        if (settings.soundEnabled) {
            playNotificationSound()
        }

        if (settings.notifications && "Notification" in window) {
            new Notification(mode === "focus" ? "Focus session completed!" : "Break time is over!", {
                body: mode === "focus" ? "Time for a break!" : "Ready to focus again?",
                icon: "favicon/favicon.svg",
            })
        }

        if (mode === "focus") {
            const newSessions = sessions + 1
            setSessions(newSessions)

            if (newSessions % settings.longBreakInterval === 0) {
                setMode("break")
                setTimeLeft(settings.longBreakTime * 60)
            } else {
                setMode("break")
                setTimeLeft(settings.breakTime * 60)
            }
        } else {
            setMode("focus")
            setTimeLeft(settings.focusTime * 60)
        }

        if (settings.autoStart) {
            setTimeout(() => setIsRunning(true), 1000)
        }
    }

    const playNotificationSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(settings.soundVolume / 100, audioContext.currentTime)

        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.2)
    }

    const toggleTimer = () => {
        setIsRunning(!isRunning)
    }

    const resetTimer = () => {
        setIsRunning(false)
        if (mode === "focus") {
            setTimeLeft(settings.focusTime * 60)
        } else {
            setTimeLeft(settings.breakTime * 60)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const getModeText = () => {
        if (mode === "focus") return "FOCUS TIME"
        if (sessions > 0 && sessions % settings.longBreakInterval === 0) return "LONG BREAK"
        return "BREAK TIME"
    }

    const handleSettingsChange = (key: keyof TimerSettings, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }))
    }

    const requestNotificationPermission = async () => {
        if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission()
        }
    }

    const resetAllSettings = () => {
        setSettings({
            focusTime: 25,
            breakTime: 5,
            longBreakTime: 15,
            longBreakInterval: 4,
            autoStart: false,
            soundEnabled: true,
            soundVolume: 50,
            notifications: true,
        })
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#4a3728" }}>
            <div className="absolute top-3 sm:top-6 left-3 sm:left-6 text-[#f5f1e8] text-xs sm:text-sm font-semibold opacity-90 z-10">
                <span className="hidden sm:inline">Made By <a href="https://github.com/JunLovin" target="_blank" className="underline">Said Ruiz</a> with ♥️ and ☕</span>
                <span className="sm:hidden">Made By <a href="https://github.com/JunLovin" target="_blank" className="underline">Said Ruiz</a></span>
            </div>
            <div className="absolute top-3 sm:top-6 right-3 sm:right-6 z-10">
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-[#f5f1e8] hover:text-[#f5f1e8] hover:bg-[#5a4738] w-8 h-8 sm:w-10 sm:h-10 cursor-pointer">
                            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#4a3728] border-[#f5f1e8]/20 text-[#f5f1e8] max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-[#f5f1e8] text-xl sm:text-2xl font-bold flex items-center gap-2">
                                <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                                Timer Settings
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#f5f1e8] flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Timer Durations
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="focusTime" className="text-[#f5f1e8] font-medium">
                                            Focus Time (minutes)
                                        </Label>
                                        <Input
                                            id="focusTime"
                                            type="number"
                                            min="1"
                                            max="120"
                                            value={settings.focusTime}
                                            onChange={(e) => handleSettingsChange("focusTime", Number.parseInt(e.target.value) || 25)}
                                            className="bg-[#5a4738] border-[#f5f1e8]/30 text-[#f5f1e8] focus:border-[#f5f1e8]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="breakTime" className="text-[#f5f1e8] font-medium">
                                            Short Break (minutes)
                                        </Label>
                                        <Input
                                            id="breakTime"
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={settings.breakTime}
                                            onChange={(e) => handleSettingsChange("breakTime", Number.parseInt(e.target.value) || 5)}
                                            className="bg-[#5a4738] border-[#f5f1e8]/30 text-[#f5f1e8] focus:border-[#f5f1e8]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="longBreakTime" className="text-[#f5f1e8] font-medium">
                                            Long Break (minutes)
                                        </Label>
                                        <Input
                                            id="longBreakTime"
                                            type="number"
                                            min="1"
                                            max="120"
                                            value={settings.longBreakTime}
                                            onChange={(e) => handleSettingsChange("longBreakTime", Number.parseInt(e.target.value) || 15)}
                                            className="bg-[#5a4738] border-[#f5f1e8]/30 text-[#f5f1e8] focus:border-[#f5f1e8]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="longBreakInterval" className="text-[#f5f1e8] font-medium">
                                            Long Break Every
                                        </Label>
                                        <Input
                                            id="longBreakInterval"
                                            type="number"
                                            min="2"
                                            max="10"
                                            value={settings.longBreakInterval}
                                            onChange={(e) => handleSettingsChange("longBreakInterval", Number.parseInt(e.target.value) || 4)}
                                            className="bg-[#5a4738] border-[#f5f1e8]/30 text-[#f5f1e8] focus:border-[#f5f1e8]"
                                        />
                                        <p className="text-xs text-[#f5f1e8]/70">sessions</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#f5f1e8] flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" />
                                    Audio Settings
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-[#f5f1e8] font-medium">Sound Notifications</Label>
                                            <p className="text-xs text-[#f5f1e8]/70">Play sound when timer completes</p>
                                        </div>
                                        <Switch
                                            checked={settings.soundEnabled}
                                            onCheckedChange={(checked) => handleSettingsChange("soundEnabled", checked)}
                                            className="data-[state=checked]:bg-[#f5f1e8] cursor-pointer"
                                        />
                                    </div>

                                    {settings.soundEnabled && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[#f5f1e8] font-medium">Volume</Label>
                                                <span className="text-sm text-[#f5f1e8]/70">{settings.soundVolume}%</span>
                                            </div>
                                            <Slider
                                                value={[settings.soundVolume]}
                                                onValueChange={(value) => handleSettingsChange("soundVolume", value[0])}
                                                max={100}
                                                step={10}
                                                className="w-full"
                                            />
                                            <Button
                                                onClick={playNotificationSound}
                                                variant="outline"
                                                size="sm"
                                                className="border-[#f5f1e8]/30 text-[#5a4738] hover:text-[#f5f1e8] cursor-pointer hover:bg-[#5a4738] text-xs"
                                            >
                                                Test Sound
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#f5f1e8] flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    Behavior
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-[#f5f1e8] font-medium">Auto-start Sessions</Label>
                                            <p className="text-xs text-[#f5f1e8]/70">Automatically start next session</p>
                                        </div>
                                        <Switch
                                            checked={settings.autoStart}
                                            onCheckedChange={(checked) => handleSettingsChange("autoStart", checked)}
                                            className="data-[state=checked]:bg-[#f5f1e8] cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label className="text-[#f5f1e8] font-medium">Browser Notifications</Label>
                                            <p className="text-xs text-[#f5f1e8]/70">Show desktop notifications</p>
                                        </div>
                                        <Switch
                                            checked={settings.notifications}
                                            onCheckedChange={(checked) => {
                                                handleSettingsChange("notifications", checked)
                                                if (checked) requestNotificationPermission()
                                            }}
                                            className="data-[state=checked]:bg-[#f5f1e8] cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#f5f1e8]/20">
                                <Button
                                    onClick={resetAllSettings}
                                    variant="outline"
                                    className="border-[#f5f1e8]/30 bg-[#5a4738] text-[#f5f1e8] flex-1 hover:bg-black/10 hover:text-[#f5f1e8] cursor-pointer"
                                >
                                    Reset to Defaults
                                </Button>
                                <Button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="bg-[#f5f1e8] text-[#4a3728] hover:bg-[#e8e0d0] font-bold flex-1 cursor-pointer"
                                >
                                    Save Settings
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-16 sm:py-8">
                <div className="w-full max-w-7xl">
                    <div className="lg:hidden space-y-8 sm:space-y-12">
                        <div className="text-center space-y-4 sm:space-y-6">
                            <div
                                className="font-black leading-none"
                                style={{
                                    fontSize: "clamp(3.5rem, 20vw, 6rem)",
                                    color: "#f5f1e8",
                                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                    fontWeight: "900",
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {formatTime(timeLeft)}
                            </div>
                            <div
                                className="font-bold tracking-[0.15em] sm:tracking-[0.25em] uppercase"
                                style={{
                                    fontSize: "clamp(1.2rem, 6vw, 2rem)",
                                    color: "#f5f1e8",
                                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                    fontWeight: "700",
                                }}
                            >
                                {getModeText()}
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <div className="relative w-64 sm:w-80">
                                <div
                                    className="w-full aspect-square rounded-2xl sm:rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl"
                                    style={{ backgroundColor: "#5a4738" }}
                                >
                                    <div className="text-[#f5f1e8] text-6xl sm:text-8xl">{mode === "focus" ? "🧑‍💻" : "🚶‍♂️"}</div>
                                </div>

                                <div
                                    className="absolute -top-3 -right-3 px-3 py-2 sm:px-4 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-lg"
                                    style={{
                                        backgroundColor: "#f5f1e8",
                                        color: "#4a3728",
                                    }}
                                >
                                    {mode === "focus" ? "🧠 Focus" : "☕ Break"}
                                </div>

                                <div
                                    className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 sm:px-4 sm:py-2 rounded-full font-semibold text-xs sm:text-sm shadow-lg"
                                    style={{
                                        backgroundColor: isRunning ? "#22c55e" : "#f59e0b",
                                        color: "#ffffff",
                                    }}
                                >
                                    {isRunning ? "⏱️ Running" : "⏸️ Paused"}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                <Button
                                    onClick={toggleTimer}
                                    className="bg-[#f5f1e8] hover:bg-[#e8e0d0] text-[#4a3728] font-bold px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg transition-all duration-200 hover:scale-105 shadow-lg w-full sm:w-auto cursor-pointer"
                                >
                                    {isRunning ? (
                                        <>
                                            <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                            Start
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={resetTimer}
                                    className="bg-[#f5f1e8] hover:bg-[#e8e0d0] text-[#4a3728] font-bold px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg transition-all duration-200 hover:scale-105 shadow-lg w-full sm:w-auto cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                    Reset
                                </Button>
                            </div>
                            <div className="flex gap-4 flex-col sm:flex-row sm:gap-3 justify-center">
                                <Button
                                    onClick={() => {
                                        setMode("focus")
                                        setTimeLeft(settings.focusTime * 60)
                                        setIsRunning(false)
                                    }}
                                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 cursor-pointer "text-[#f5f1e8] hover:bg-[#5a4738] border border-[#f5f1e8]/30 bg-transparent"`}
                                >   
                                    Focus
                                </Button>

                                <Button
                                    onClick={() => {
                                        setMode("break")
                                        setTimeLeft(settings.breakTime * 60)
                                        setIsRunning(false)
                                    }}
                                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 cursor-pointer text-[#f5f1e8] hover:bg-[#5a4738] border border-[#f5f1e8]/30 bg-transparent`}
                                >
                                    Break
                                </Button>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-[#f5f1e8] opacity-90 text-lg sm:text-xl font-semibold">
                                Sessions: <span className="font-bold text-xl sm:text-2xl">{sessions}</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div
                                    className="font-black leading-none"
                                    style={{
                                        fontSize: "clamp(5rem, 12vw, 10rem)",
                                        color: "#f5f1e8",
                                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                        fontWeight: "900",
                                        letterSpacing: "-0.02em",
                                    }}
                                >
                                    {formatTime(timeLeft)}
                                </div>
                                <div
                                    className="font-bold tracking-[0.25em] uppercase"
                                    style={{
                                        fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                        color: "#f5f1e8",
                                        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                                        fontWeight: "700",
                                    }}
                                >
                                    {getModeText()}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button
                                    onClick={toggleTimer}
                                    className="bg-[#f5f1e8] hover:bg-[#e8e0d0] text-[#4a3728] font-bold px-8 py-3 rounded-xl text-lg transition-all duration-200 hover:scale-105 shadow-lg cursor-pointer"
                                >
                                    {isRunning ? (
                                        <>
                                            <Pause className="w-5 h-5 mr-2" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Start
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={resetTimer}
                                    variant="outline"
                                    className="bg-[#f5f1e8] hover:bg-[#e8e0d0] text-[#4a3728] font-bold px-8 py-3 rounded-xl text-lg transition-all duration-200 hover:scale-105 shadow-lg cursor-pointer"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Reset
                                </Button>

                                <Button
                                    onClick={() => {
                                        setMode("focus")
                                        setTimeLeft(settings.focusTime * 60)
                                        setIsRunning(false)
                                    }}
                                    variant="ghost"
                                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 cursor-pointer text-[#f5f1e8] hover:text-[#f5f1e8] hover:bg-[#5a4738] border border-[#f5f1e8]/30 bg-transparent`}
                                >
                                    Focus
                                </Button>

                                <Button
                                    onClick={() => {
                                        setMode("break")
                                        setTimeLeft(settings.breakTime * 60)
                                        setIsRunning(false)
                                    }}
                                    variant="ghost"
                                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 cursor-pointer text-[#f5f1e8] hover:bg-[#5a4738] border border-[#f5f1e8]/30 hover:text-[#f5f1e8]`}
                                >
                                    Break
                                </Button>
                            </div>
                            <div className="pt-4">
                                <div className="text-[#f5f1e8] opacity-90 text-xl font-semibold">
                                    Sessions completed: <span className="font-bold text-2xl">{sessions}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center items-center">
                            <div className="relative w-full max-w-md">
                                <div
                                    className="w-full aspect-square rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl"
                                    style={{ backgroundColor: "#5a4738" }}
                                >
                                    <div className="text-[#f5f1e8] text-8xl">{mode === "focus" ? "🧑‍💻" : "🚶"}</div>
                                </div>

                                <div
                                    className="absolute -top-4 -right-4 px-6 py-3 rounded-full font-bold text-lg shadow-lg"
                                    style={{
                                        backgroundColor: "#f5f1e8",
                                        color: "#4a3728",
                                    }}
                                >
                                    {mode === "focus" ? "🧠 Focusing" : "☕ Break Time"}
                                </div>

                                <div
                                    className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full font-semibold text-sm shadow-lg"
                                    style={{
                                        backgroundColor: isRunning ? "#22c55e" : "#f59e0b",
                                        color: "#ffffff",
                                    }}
                                >
                                    {isRunning ? "⏱️ Running" : "⏸️ Paused"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
