// components/forms/form-filler.jsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';

export default function FormFiller({ form }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically generate validation schema
  const fieldSchemas = form.questions.reduce((acc, question) => {
    const baseSchema = z.string().min(question.required ? 1 : 0, {
      message: `${question.label} is required`
    });
    acc[`question_${question.id}`] = question.required 
      ? baseSchema 
      : baseSchema.optional();
    return acc;
  }, {});

  const formSchema = z.object(fieldSchemas);

  const formMethods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: form.questions.reduce((acc, question) => {
      acc[`question_${question.id}`] = '';
      return acc;
    }, {})
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const answers = Object.entries(data).map(([key, value]) => ({
        questionId: key.replace('question_', ''),
        value: value.toString()
      }));

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId: form.id,
          answers
        })
      });

      if (!response.ok) throw new Error('Failed to submit response');

      toast.success("Your response has been recorded!");

      router.push(`/forms/${form.id}/confirmation`);
    } catch (error) {
      toast.error(`Error: ${error.message || 'Failed to submit form'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-3xl">{form.title}</CardTitle>
        {form.description && (
          <p className="text-muted-foreground mt-2">{form.description}</p>
        )}
      </CardHeader>
      
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {form.questions.map((question) => (
              <FormField
                key={question.id}
                control={formMethods.control}
                name={`question_${question.id}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {question.label}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FormLabel>
                    
                    {question.type === 'TEXT' ? (
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={question.placeholder || ''}
                        />
                      </FormControl>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {question.options.map((option) => (
                            <SelectItem 
                              key={option.id} 
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {question.placeholder && (
                      <FormDescription>
                        {question.placeholder}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>

          <CardFooter className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className={isSubmitting ? "cursor-not-allowed" : 'cursor-pointer'}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}  className={isSubmitting ? "cursor-not-allowed" : 'cursor-pointer'}>
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}