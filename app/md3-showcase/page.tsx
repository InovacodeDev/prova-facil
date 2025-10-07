"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MD3ShowcasePage() {
  return (
    <div className="min-h-screen bg-surface-container-low p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-display-medium text-on-surface">Material Design 3 Components</h1>
          <p className="text-body-large text-on-surface-variant">
            Showcasing MD3 design tokens and component variants
          </p>
        </div>

        {/* Color System Section */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <CardTitle>Color System</CardTitle>
            <CardDescription>MD3 surface and container colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-surface rounded-lg border-2 border-outline" />
                <p className="text-body-small text-on-surface-variant">Surface</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-surface-container rounded-lg" />
                <p className="text-body-small text-on-surface-variant">Surface Container</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-surface-container-high rounded-lg" />
                <p className="text-body-small text-on-surface-variant">Surface Container High</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-surface-container-highest rounded-lg" />
                <p className="text-body-small text-on-surface-variant">Surface Container Highest</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-primary-container text-on-primary-container rounded-lg flex items-center justify-center">
                  Primary
                </div>
                <p className="text-body-small text-on-surface-variant">Primary Container</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center">
                  Secondary
                </div>
                <p className="text-body-small text-on-surface-variant">Secondary Container</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-tertiary-container text-on-tertiary-container rounded-lg flex items-center justify-center">
                  Tertiary
                </div>
                <p className="text-body-small text-on-surface-variant">Tertiary Container</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-error-container text-on-error-container rounded-lg flex items-center justify-center">
                  Error
                </div>
                <p className="text-body-small text-on-surface-variant">Error Container</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>MD3 button styles with different emphasis levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-title-small text-on-surface">Standard Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="filled">Filled</Button>
                <Button variant="filled-tonal">Filled Tonal</Button>
                <Button variant="elevated">Elevated</Button>
                <Button variant="outlined">Outlined</Button>
                <Button variant="text">Text</Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-title-small text-on-surface">Button Shapes</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="filled" shape="default">Default Shape</Button>
                <Button variant="filled" shape="pill">Pill Shape</Button>
                <Button variant="filled" shape="square">Square Shape</Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-title-small text-on-surface">Button Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="filled" size="sm">Small</Button>
                <Button variant="filled" size="default">Default</Button>
                <Button variant="filled" size="lg">Large</Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-title-small text-on-surface">Legacy Variants (Gradient)</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="hero">Hero Button</Button>
                <Button variant="accent">Accent Button</Button>
                <Button variant="success">Success Button</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Variants */}
        <div className="space-y-4">
          <h2 className="text-headline-medium text-on-surface">Card Variants</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Uses shadow for elevation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-medium text-on-surface-variant">
                  This card uses shadow-elevation-1 and hovers to elevation-2.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="text">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="filled">
              <CardHeader>
                <CardTitle>Filled Card</CardTitle>
                <CardDescription>Uses surface color fill</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-medium text-on-surface-variant">
                  This card uses surface-container-highest background.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="text">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="outlined">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>Uses border outline</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body-medium text-on-surface-variant">
                  This card uses a 2px outline border.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="text">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Elevation System */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Elevation System</CardTitle>
            <CardDescription>MD3 elevation levels (0-5)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <Card key={level} elevation={level as 0 | 1 | 2 | 3 | 4 | 5}>
                  <CardHeader>
                    <CardTitle>Level {level}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-body-small text-on-surface-variant">
                      shadow-elevation-{level}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Typography Scale */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>MD3 type system with semantic names</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="display" className="w-full">
              <TabsList>
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="headline">Headline</TabsTrigger>
                <TabsTrigger value="title">Title</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="label">Label</TabsTrigger>
              </TabsList>
              
              <TabsContent value="display" className="space-y-4">
                <div>
                  <p className="text-display-large text-on-surface">Display Large</p>
                  <p className="text-body-small text-on-surface-variant">57px / 64px - Hero sections</p>
                </div>
                <div>
                  <p className="text-display-medium text-on-surface">Display Medium</p>
                  <p className="text-body-small text-on-surface-variant">45px / 52px - Large headers</p>
                </div>
                <div>
                  <p className="text-display-small text-on-surface">Display Small</p>
                  <p className="text-body-small text-on-surface-variant">36px / 44px - Section headers</p>
                </div>
              </TabsContent>

              <TabsContent value="headline" className="space-y-4">
                <div>
                  <p className="text-headline-large text-on-surface">Headline Large</p>
                  <p className="text-body-small text-on-surface-variant">32px / 40px</p>
                </div>
                <div>
                  <p className="text-headline-medium text-on-surface">Headline Medium</p>
                  <p className="text-body-small text-on-surface-variant">28px / 36px</p>
                </div>
                <div>
                  <p className="text-headline-small text-on-surface">Headline Small</p>
                  <p className="text-body-small text-on-surface-variant">24px / 32px</p>
                </div>
              </TabsContent>

              <TabsContent value="title" className="space-y-4">
                <div>
                  <p className="text-title-large text-on-surface">Title Large</p>
                  <p className="text-body-small text-on-surface-variant">22px / 28px - App bars</p>
                </div>
                <div>
                  <p className="text-title-medium text-on-surface">Title Medium</p>
                  <p className="text-body-small text-on-surface-variant">16px / 24px - List items</p>
                </div>
                <div>
                  <p className="text-title-small text-on-surface">Title Small</p>
                  <p className="text-body-small text-on-surface-variant">14px / 20px - Dense lists</p>
                </div>
              </TabsContent>

              <TabsContent value="body" className="space-y-4">
                <div>
                  <p className="text-body-large text-on-surface">Body Large</p>
                  <p className="text-body-small text-on-surface-variant">16px / 24px - Main content</p>
                </div>
                <div>
                  <p className="text-body-medium text-on-surface">Body Medium</p>
                  <p className="text-body-small text-on-surface-variant">14px / 20px - Secondary content</p>
                </div>
                <div>
                  <p className="text-body-small text-on-surface">Body Small</p>
                  <p className="text-body-small text-on-surface-variant">12px / 16px - Captions</p>
                </div>
              </TabsContent>

              <TabsContent value="label" className="space-y-4">
                <div>
                  <p className="text-label-large text-on-surface">Label Large</p>
                  <p className="text-body-small text-on-surface-variant">14px / 20px - Buttons, tabs</p>
                </div>
                <div>
                  <p className="text-label-medium text-on-surface">Label Medium</p>
                  <p className="text-body-small text-on-surface-variant">12px / 16px - Small buttons</p>
                </div>
                <div>
                  <p className="text-label-small text-on-surface">Label Small</p>
                  <p className="text-body-small text-on-surface-variant">11px / 16px - Dense UI</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Shape System */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Shape System</CardTitle>
            <CardDescription>Border radius options from MD3</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { name: "None", class: "rounded-none" },
                { name: "XS", class: "rounded-xs" },
                { name: "SM", class: "rounded-sm" },
                { name: "MD", class: "rounded-md" },
                { name: "LG", class: "rounded-lg" },
                { name: "XL", class: "rounded-xl" },
                { name: "2XL", class: "rounded-2xl" },
                { name: "Full", class: "rounded-full" },
              ].map((shape) => (
                <div key={shape.name} className="space-y-2">
                  <div className={`h-20 bg-primary ${shape.class}`} />
                  <p className="text-body-small text-on-surface-variant text-center">{shape.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Motion System Demo */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Motion System</CardTitle>
            <CardDescription>Hover over buttons to see MD3 easing in action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="filled"
                className="transition-all duration-short-3 ease-standard hover:scale-105"
              >
                Standard Easing
              </Button>
              <Button
                variant="filled-tonal"
                className="transition-all duration-medium-1 ease-emphasized hover:scale-105"
              >
                Emphasized Easing
              </Button>
              <Button
                variant="elevated"
                className="transition-all duration-medium-2 ease-emphasized-decelerate hover:scale-105"
              >
                Decelerate
              </Button>
              <Button
                variant="outlined"
                className="transition-all duration-medium-2 ease-emphasized-accelerate hover:scale-105"
              >
                Accelerate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
