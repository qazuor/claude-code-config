# React Hook Form Patterns

Expert patterns for **React Hook Form** with Zod validation.

## Core Concepts

- Performant form handling
- Minimal re-renders
- Zod schema validation
- TypeScript integration
- Controlled and uncontrolled inputs

## Setup

### Basic Form with Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await loginUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && (
          <span role="alert">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={errors.password ? 'true' : 'false'}
        />
        {errors.password && (
          <span role="alert">{errors.password.message}</span>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          Remember me
        </label>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
}
```

## Complex Schema Patterns

### Nested Objects

```typescript
const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
  country: z.string().min(1, 'Country is required'),
});

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  address: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsBilling: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

function UserForm() {
  const { register, watch, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const sameAsBilling = watch('sameAsBilling');

  return (
    <form>
      <input {...register('firstName')} />
      <input {...register('lastName')} />

      {/* Nested fields */}
      <fieldset>
        <legend>Address</legend>
        <input {...register('address.street')} />
        <input {...register('address.city')} />
        <input {...register('address.zipCode')} />
        {errors.address?.street && <span>{errors.address.street.message}</span>}
      </fieldset>

      <label>
        <input type="checkbox" {...register('sameAsBilling')} />
        Billing address same as shipping
      </label>

      {!sameAsBilling && (
        <fieldset>
          <legend>Billing Address</legend>
          <input {...register('billingAddress.street')} />
          <input {...register('billingAddress.city')} />
        </fieldset>
      )}
    </form>
  );
}
```

### Arrays with useFieldArray

```typescript
const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one item is required'),
});

type OrderFormData = z.infer<typeof orderSchema>;

function OrderForm() {
  const { control, register, handleSubmit, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 1, notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`items.${index}.productId`)} />
          <input
            type="number"
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          />
          <input {...register(`items.${index}.notes`)} />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
          {errors.items?.[index]?.productId && (
            <span>{errors.items[index]?.productId?.message}</span>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ productId: '', quantity: 1, notes: '' })}
      >
        Add Item
      </button>

      <button type="submit">Submit Order</button>
    </form>
  );
}
```

## Controlled Components

### Using Controller

```typescript
import { Controller, useForm } from 'react-hook-form';
import { Select, DatePicker } from '@/components/ui';

const eventSchema = z.object({
  title: z.string().min(1),
  date: z.date(),
  category: z.enum(['meeting', 'deadline', 'reminder']),
  priority: z.number().min(1).max(5),
});

type EventFormData = z.infer<typeof eventSchema>;

function EventForm() {
  const { control, handleSubmit } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="date"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            selected={field.value}
            onChange={field.onChange}
            error={error?.message}
          />
        )}
      />

      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            options={[
              { label: 'Meeting', value: 'meeting' },
              { label: 'Deadline', value: 'deadline' },
              { label: 'Reminder', value: 'reminder' },
            ]}
          />
        )}
      />

      <Controller
        name="priority"
        control={control}
        render={({ field }) => (
          <Slider
            value={[field.value]}
            onValueChange={([value]) => field.onChange(value)}
            min={1}
            max={5}
          />
        )}
      />
    </form>
  );
}
```

## Integration with Shadcn UI

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const profileSchema = z.object({
  username: z.string().min(2).max(30),
  bio: z.string().max(160).optional(),
});

function ProfileForm() {
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Update profile</Button>
      </form>
    </Form>
  );
}
```

## Advanced Patterns

### Form with File Upload

```typescript
const uploadSchema = z.object({
  title: z.string().min(1),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'File is required')
    .refine(
      (files) => files[0]?.size <= 5 * 1024 * 1024,
      'File must be less than 5MB'
    )
    .refine(
      (files) => ['image/jpeg', 'image/png'].includes(files[0]?.type),
      'Only JPEG and PNG files are allowed'
    ),
});

function UploadForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (data: z.infer<typeof uploadSchema>) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('file', data.file[0]);
    await uploadFile(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      <input type="file" {...register('file')} accept="image/jpeg,image/png" />
      {errors.file && <span>{errors.file.message}</span>}
      <button type="submit">Upload</button>
    </form>
  );
}
```

### Async Validation

```typescript
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

function RegisterForm() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  // Async validation for username availability
  const validateUsername = async (username: string) => {
    const response = await fetch(`/api/check-username?username=${username}`);
    const { available } = await response.json();
    if (!available) {
      form.setError('username', {
        type: 'manual',
        message: 'Username is already taken',
      });
      return false;
    }
    return true;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register('username')}
        onBlur={(e) => validateUsername(e.target.value)}
      />
      {/* ... */}
    </form>
  );
}
```

### Multi-step Form

```typescript
const steps = ['Personal', 'Address', 'Review'] as const;

const personalSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(5),
});

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const personalForm = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues: formData,
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: formData,
  });

  const handleNext = async (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    await submitRegistration(formData);
  };

  return (
    <div>
      <Steps current={step} steps={steps} />

      {step === 0 && (
        <form onSubmit={personalForm.handleSubmit(handleNext)}>
          {/* Personal fields */}
          <button type="submit">Next</button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={addressForm.handleSubmit(handleNext)}>
          {/* Address fields */}
          <button type="button" onClick={handleBack}>Back</button>
          <button type="submit">Next</button>
        </form>
      )}

      {step === 2 && (
        <div>
          <ReviewData data={formData} />
          <button onClick={handleBack}>Back</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Zod Schemas**: Define schemas separately for reuse and testing
2. **Type Inference**: Use `z.infer<typeof schema>` for types
3. **Validation Mode**: Use `mode: 'onBlur'` for better UX
4. **Controller**: Use Controller for controlled components
5. **useFieldArray**: Use for dynamic arrays
6. **Error Handling**: Show errors inline with accessible markup

## When to Use

- Any React form with validation
- Complex multi-step forms
- Forms with dynamic fields
- When you need minimal re-renders
- Integration with UI libraries
