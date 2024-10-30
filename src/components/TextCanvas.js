import React, { useState, useRef, useEffect } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Slider } from "./ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Switch } from "./ui/switch"

export default function TextCanvas() {
  const canvasRef = useRef(null)
  const [text, setText] = useState('')
  const [font, setFont] = useState('Arial')
  const [size, setSize] = useState(20)
  const [color, setColor] = useState('#000000')
  const [textObjects, setTextObjects] = useState([])
  const [selectedText, setSelectedText] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 })
  const [showGrid, setShowGrid] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [cursorStyle, setCursorStyle] = useState('default')

  useEffect(() => {
    const handleResize = () => {
      let width = Math.min(800, window.innerWidth - 32)
      if (window.innerWidth >= 1024) {
        width = Math.min(600, window.innerWidth / 2 - 32)
      }
      const height = Math.round((width / 4) * 3)
      setCanvasSize({ width, height })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      
      if (showGrid) {
        drawGrid(ctx)
      }
      
      textObjects.forEach((obj) => {
        ctx.font = `${obj.size}px ${obj.font}`
        ctx.fillStyle = obj.color
        ctx.fillText(obj.text, obj.x, obj.y)
      })
    }
  }, [textObjects, canvasSize, showGrid])

  const drawGrid = (ctx) => {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= canvasSize.width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSize.height)
      ctx.stroke()
    }
    for (let y = 0; y <= canvasSize.height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSize.width, y)
      ctx.stroke()
    }
  }

  const addText = () => {
    if (text) {
      const newTextObjects = [...textObjects, { text, x: 50, y: 50, font, size, color }]
      setTextObjects(newTextObjects)
      setText('')
      addToHistory(newTextObjects)
    }
  }

  const updateSelectedText = () => {
    if (selectedText !== null) {
      const newTextObjects = textObjects.map((obj, index) =>
        index === selectedText ? { ...obj, font, size, color } : obj
      )
      setTextObjects(newTextObjects)
      addToHistory(newTextObjects)
    }
  }

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const clickedTextIndex = textObjects.findIndex((obj) => 
        x >= obj.x && x <= obj.x + obj.size * obj.text.length / 2 &&
        y >= obj.y - obj.size && y <= obj.y
      )
      if (clickedTextIndex !== -1) {
        setSelectedText(clickedTextIndex)
        setIsDragging(true)
        const selectedObj = textObjects[clickedTextIndex]
        setFont(selectedObj.font)
        setSize(selectedObj.size)
        setColor(selectedObj.color)
      } else {
        setSelectedText(null)
      }
    }
  }

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const isOverText = textObjects.some((obj) => 
        x >= obj.x && x <= obj.x + obj.size * obj.text.length / 2 &&
        y >= obj.y - obj.size && y <= obj.y
      )
      
      setCursorStyle(isOverText ? 'move' : 'default')

      if (isDragging && selectedText !== null) {
        const newTextObjects = textObjects.map((obj, index) => 
          index === selectedText ? { ...obj, x, y } : obj
        )
        setTextObjects(newTextObjects)
      }
    }
  }

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      addToHistory(textObjects)
    }
    setIsDragging(false)
  }

  const addToHistory = (newState) => {
    setHistory([...history.slice(0, historyIndex + 1), newState])
    setHistoryIndex(historyIndex + 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setTextObjects(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setTextObjects(history[historyIndex + 1])
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Text Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row">
            <div className="mb-4 lg:mr-4 lg:w-2/3">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className="border border-gray-300 w-full"
                  style={{ cursor: cursorStyle }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>Undo</Button>
                  <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>Redo</Button>
                </div>
              </div>
            </div>
            <div className="lg:w-1/3">
              <Tabs defaultValue="add" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="add">Add Text</TabsTrigger>
                  <TabsTrigger value="edit">Edit Text</TabsTrigger>
                </TabsList>
                <TabsContent value="add">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="text-input">Text</Label>
                      <Input
                        id="text-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text"
                      />
                    </div>
                    <Button onClick={addText} className="w-full">Add Text</Button>
                  </div>
                </TabsContent>
                <TabsContent value="edit">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="font-select">Font</Label>
                      <select
                        id="font-select"
                        value={font}
                        onChange={(e) => {
                          setFont(e.target.value)
                          updateSelectedText()
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="size-slider">Size: {size}px</Label>
                      <Slider
                        id="size-slider"
                        min={10}
                        max={100}
                        step={1}
                        value={[size]}
                        onValueChange={(value) => {
                          setSize(value[0])
                          updateSelectedText()
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="color-input">Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="color-input"
                          type="color"
                          value={color}
                          onChange={(e) => {
                            setColor(e.target.value)
                            updateSelectedText()
                          }}
                          className="w-12 h-12 p-1"
                        />
                        <Input
                          type="text"
                          value={color}
                          onChange={(e) => {
                            setColor(e.target.value)
                            updateSelectedText()
                          }}
                          className="flex-grow"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={setShowGrid}
            />
            <Label htmlFor="show-grid">Show Grid</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}